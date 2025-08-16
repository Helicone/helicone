import { z } from "zod";
import { Path, Str } from "@cloudflare/itty-router-openapi";
import { BaseAPIRoute } from "../../../baseAPIRoute";
const ReturnBody = z
    .object({
    providerKey: z.string(),
})
    .array();
export class ProviderKeyGet extends BaseAPIRoute {
    static schema = {
        tags: ["Customer Portal"],
        summary: "Gets the provider key for a customer",
        // requestBody: BodyOpenAPI,
        parameters: {
            customerId: Path(Str, {
                description: "customer id",
            }),
        },
        responses: {
            "200": {
                description: "Task fetched successfully",
                schema: {
                    metaData: {},
                    task: ReturnBody,
                },
            },
        },
    };
    async heliconeHandle({ request, client, authParams, }) {
        const { params: { customerId }, } = request;
        const customers = await client.db
            .getClient()
            .from("organization")
            .select("*")
            .eq("reseller_id", authParams.organizationId)
            .eq("id", customerId)
            .eq("organization_type", "customer")
            .eq("soft_delete", false)
            .single();
        if (customers.error) {
            throw new Error(JSON.stringify(customers.error));
        }
        const providerKey = await client.db
            .getClient()
            .from("decrypted_provider_keys_v2")
            .select("*")
            .eq("provider_key", customers?.data.org_provider_key ?? "")
            .single();
        return [
            {
                providerKey: providerKey.data?.provider_key ?? "",
            },
        ];
    }
}
