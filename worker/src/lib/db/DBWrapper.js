import { createClient } from "@supabase/supabase-js";
import { hash } from "../..";
import { getProviderKeyFromProxyCache } from "../RequestWrapper";
import { getAndStoreInCache } from "../util/cache/secureCache";
import { err, ok } from "../util/results";
import { RateLimiter } from "../clients/RequestRateLimiter";
const RATE_LIMIT_CACHE_TTL = 120; // 2 minutes
async function getHeliconeApiKeyRow(dbClient, heliconeApi) {
    const { data, error } = await dbClient
        .from("helicone_api_keys")
        .select("*")
        .eq("api_key_hash", await hash(heliconeApi))
        .eq("soft_delete", false)
        .single();
    if (error !== null) {
        return { data: null, error: error.message };
    }
    return {
        data: {
            organizationId: data?.organization_id,
            userId: data?.user_id,
            heliconeApiKeyId: data?.id,
        },
        error: null,
    };
}
async function getHeliconeProxyKeyRow(dbClient, { token }, env) {
    const { data, error } = await getProviderKeyFromProxyCache(token, env, dbClient);
    if (error || !data) {
        return err(error);
    }
    return ok({
        organizationId: data.organizationId,
        userId: undefined,
        heliconeApiKeyId: undefined,
    });
}
async function getHeliconeJwtAuthParams(dbClient, orgId, heliconeJwt) {
    const user = await dbClient.auth.getUser(heliconeJwt);
    if (user.error) {
        console.error("Error fetching user:", user.error.message);
        return { error: user.error.message, data: null };
    }
    const orgOwner = await dbClient
        .from("organization")
        .select("*")
        .eq("id", orgId)
        .eq("owner", user.data.user.id);
    if (orgOwner.error) {
        console.error("Error fetching user:", orgOwner.error?.message);
        return { error: orgOwner.error?.message, data: null };
    }
    if (orgOwner.data.length > 0) {
        return {
            data: {
                organizationId: orgOwner.data[0].id,
                userId: user.data.user.id,
                heliconeApiKeyId: undefined,
            },
            error: null,
        };
    }
    else {
        const orgMember = await dbClient
            .from("organization_member")
            .select("*")
            .eq("member", user.data.user.id)
            .eq("organization", orgId)
            .single();
        if (orgMember.error) {
            console.error("Error fetching user:", orgMember.error.message);
            return { error: orgMember.error.message, data: null };
        }
        if (orgMember.data) {
            return {
                data: {
                    organizationId: orgMember.data.organization,
                    userId: user.data.user.id,
                    heliconeApiKeyId: undefined,
                },
                error: null,
            };
        }
        return { data: null, error: "Invalid authentication." };
    }
}
export class DBWrapper {
    env;
    auth;
    supabaseClient;
    secureCacheEnv;
    atomicRateLimiter;
    rateLimiter;
    authParams;
    tier;
    constructor(env, auth) {
        this.env = env;
        this.auth = auth;
        this.supabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
        this.secureCacheEnv = {
            REQUEST_CACHE_KEY: env.REQUEST_CACHE_KEY,
            SECURE_CACHE: env.SECURE_CACHE,
            REQUEST_CACHE_KEY_2: env.REQUEST_CACHE_KEY_2,
        };
        this.atomicRateLimiter = env.RATE_LIMITER;
    }
    getClient() {
        return this.supabaseClient;
    }
    async getRateLimiter() {
        if (this.rateLimiter !== undefined) {
            return ok(this.rateLimiter);
        }
        const authParams = await this.getAuthParams();
        if (authParams.error !== null) {
            return err(authParams.error);
        }
        this.rateLimiter = new RateLimiter(this.atomicRateLimiter, authParams.data);
        return ok(this.rateLimiter);
    }
    async _getAuthParamsInternal() {
        switch (this.auth._type) {
            case "jwt":
                if (!this.auth.orgId) {
                    return err("Helicone organization id is required for JWT authentication.");
                }
                return getHeliconeJwtAuthParams(this.supabaseClient, this.auth.orgId, this.auth.token);
            case "bearerProxy":
                return getHeliconeProxyKeyRow(this.supabaseClient, this.auth, this.env);
            case "bearer":
                return getHeliconeApiKeyRow(this.supabaseClient, this.auth.token);
        }
        throw new Error("Invalid authentication."); // this is unreachable
    }
    async _getAuthParams() {
        const internalAuthParams = await this._getAuthParamsInternal();
        if (internalAuthParams.error !== null) {
            return err(internalAuthParams.error);
        }
        const org = await this.supabaseClient
            .from("organization")
            .select("*")
            .eq("id", internalAuthParams.data.organizationId)
            .single();
        if (org.error !== null) {
            return err(org.error.message);
        }
        return ok({
            organizationId: internalAuthParams.data.organizationId,
            userId: internalAuthParams.data.userId,
            heliconeApiKeyId: internalAuthParams.data.heliconeApiKeyId,
            tier: org.data.tier ?? "free",
            accessDict: {
                cache: true,
            },
        });
    }
    async getAuthParams() {
        if (this.authParams !== undefined) {
            return ok(this.authParams);
        }
        const cacheKey = (await hash(JSON.stringify(this.auth))).substring(0, 32);
        const authParams = await getAndStoreInCache(`authParams3-${cacheKey}`, this.env, async () => await this._getAuthParams());
        if (!authParams || authParams.error || !authParams.data) {
            return err(authParams?.error || "Invalid authentication.");
        }
        this.authParams = authParams.data;
        return authParams;
    }
    async getAllRateLimitPolicies() {
        const authParams = await this.getAuthParams();
        if (authParams.error !== null) {
            return err(authParams.error);
        }
        return await getAndStoreInCache(`rateLimitOptions-${authParams.data.organizationId}`, this.secureCacheEnv, async () => {
            const { data, error } = await this.supabaseClient
                .from("org_rate_limits")
                .select("*")
                .eq("organization_id", authParams.data.organizationId)
                .is("deleted_at", null);
            if (error !== null) {
                return err(error.message);
            }
            if (!data) {
                return ok([]);
            }
            const mappedData = data.map((dbPolicy) => ({
                id: dbPolicy.id,
                organization_id: dbPolicy.organization_id,
                quota: dbPolicy.quota,
                windowSeconds: dbPolicy.window_seconds,
                unit: dbPolicy.unit,
                segment: dbPolicy.segment ?? undefined,
                name: dbPolicy.name,
            }));
            return ok(mappedData);
        }, RATE_LIMIT_CACHE_TTL);
    }
    async getOrganization() {
        const authParams = await this.getAuthParams();
        if (authParams.error !== null) {
            return err(authParams.error);
        }
        return await getAndStoreInCache(`org-${authParams.data.organizationId}`, this.secureCacheEnv, async () => {
            const { data, error } = await this.supabaseClient
                .from("organization")
                .select("*")
                .eq("id", authParams.data.organizationId)
                .single();
            if (error !== null) {
                return err(error.message);
            }
            return ok({
                tier: data?.tier ?? "free",
                id: data?.id ?? "",
                percentLog: data?.percent_to_log ?? 100_000,
            });
        });
    }
    async getTier() {
        const org = await this.getOrganization();
        if (org.error !== null) {
            return err(org.error);
        }
        return ok(org.data.tier);
    }
    async isAuthorized() {
        try {
            const params = await this.getAuthParams();
            if (params.error !== null || params.data.organizationId === undefined) {
                return false;
            }
        }
        catch (e) {
            return false;
        }
        return true;
    }
    async orgId() {
        return (await this.getAuthParams()).data?.organizationId ?? "";
    }
    async getJobById(jobId) {
        const { data, error } = await this.supabaseClient
            .from("job")
            .select("*")
            .match({
            id: jobId,
        })
            .eq("org_id", await this.orgId())
            .single();
        if (error) {
            return { data: null, error: error.message };
        }
        return { data: data, error: null };
    }
    async getNodeById(nodeId) {
        const { data, error } = await this.supabaseClient
            .from("job_node")
            .select("*")
            .match({
            id: nodeId,
        })
            .eq("org_id", await this.orgId())
            .single();
        if (error) {
            return { data: null, error: error.message };
        }
        return { data: data, error: null };
    }
    async getRequestById(requestId) {
        const { data, error } = await this.supabaseClient
            .from("request")
            .select("*")
            .match({
            id: requestId,
        })
            .eq("helicone_org_id", await this.orgId())
            .single();
        if (error) {
            return { data: null, error: error.message };
        }
        return { data: data, error: null };
    }
    async insertAlert(alert) {
        const { data, error } = await this.supabaseClient
            .from("alert")
            .insert(alert)
            .select("*")
            .single();
        if (error) {
            return { data: null, error: error.message };
        }
        return { data: data, error: null };
    }
    async deleteAlert(alertId, orgId) {
        const { error } = await this.supabaseClient
            .from("alert")
            .update({ soft_delete: true })
            .eq("id", alertId)
            .eq("org_id", orgId);
        if (error) {
            return { error: error.message, data: null };
        }
        return { error: null, data: null };
    }
}
