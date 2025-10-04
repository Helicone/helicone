import { z } from "zod";
import { RateLimitStore } from "../lib/stores/RateLimitStore";
import { AuthParams } from "../packages/common/auth/types";
import { BaseManager } from "./BaseManager";
import { Result, err, ok } from "../packages/common/result";
import { Database } from "../lib/db/database.types";
import {
  RateLimitRuleView,
  CreateRateLimitRuleParams,
  UpdateRateLimitRuleParams,
} from "../controllers/private/rateLimitController"; // Import API types

// Zod Schema for Rate Limit Rule validation
const RateLimitRuleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  quota: z.number().nonnegative("Quota must be a non-negative number"),
  window_seconds: z
    .number()
    .nonnegative("Window seconds must be a non-negative number"),
  unit: z.enum(["request", "cents"], {
    errorMap: () => ({ message: "Unit must be 'request' or 'cents'" }),
  }),
  segment: z
    .string()
    .regex(/^[a-zA-Z0-9_-]*$/, {
      // Allow empty string, or alphanumeric/underscore/hyphen
      message:
        "Segment must be 'user', an empty string, or alphanumeric characters including underscores and hyphens",
    })
    .refine(
      (val) => val === "" || val === "user" || /^[a-zA-Z0-9_-]+$/.test(val),
      {
        message:
          "Segment must be 'user', an empty string, or alphanumeric characters including underscores and hyphens",
      },
    )
    .nullable()
    .optional(),
});

const CreateRateLimitRuleSchema = RateLimitRuleSchema.extend({});

const UpdateRateLimitRuleSchema = RateLimitRuleSchema.partial();

type OrgRateLimitDB = Database["public"]["Tables"]["org_rate_limits"]["Row"];
type CreateOrgRateLimitDB =
  Database["public"]["Tables"]["org_rate_limits"]["Insert"];
type UpdateOrgRateLimitDBStore = Partial<
  Omit<CreateOrgRateLimitDB, "organization_id">
>;

export class RateLimitManager extends BaseManager {
  private rateLimitStore: RateLimitStore;

  constructor(authParams: AuthParams) {
    super(authParams);
    this.rateLimitStore = new RateLimitStore();
  }

  private mapDbToView(dbRule: OrgRateLimitDB): RateLimitRuleView {
    const quota =
      typeof dbRule.quota === "string"
        ? parseFloat(dbRule.quota)
        : dbRule.quota;

    return {
      id: dbRule.id,
      name: dbRule.name,
      quota: quota,
      window_seconds: dbRule.window_seconds,
      unit: dbRule.unit as "request" | "cents",
      segment: dbRule.segment ?? undefined,
      created_at: dbRule.created_at
        ? new Date(dbRule.created_at).toISOString()
        : "",
      updated_at: dbRule.updated_at
        ? new Date(dbRule.updated_at).toISOString()
        : "",
    };
  }

  async getOrgRateLimits(): Promise<Result<RateLimitRuleView[], string>> {
    const result = await this.rateLimitStore.getRateLimitsByOrgId(
      this.authParams.organizationId,
    );
    if (result.error || !result.data) {
      return err(result.error || "Failed to fetch rate limits");
    }
    return ok(result.data.map(this.mapDbToView));
  }

  async createRateLimit(
    params: CreateRateLimitRuleParams,
  ): Promise<Result<RateLimitRuleView, string>> {
    const validationResult = CreateRateLimitRuleSchema.safeParse(params);
    if (!validationResult.success) {
      return err(
        validationResult.error.errors.map((e) => e.message).join(", "),
      );
    }

    // Use validated data
    const validatedParams = validationResult.data;

    // Map API params to DB Insert type
    const dbParams: CreateOrgRateLimitDB = {
      ...validatedParams,
      organization_id: this.authParams.organizationId,
    };

    const result = await this.rateLimitStore.createRateLimit(dbParams);
    if (result.error || !result.data) {
      return err(result.error || "Failed to create rate limit rule");
    }
    return ok(this.mapDbToView(result.data));
  }

  // Accepts API Params, Returns API View type
  async updateRateLimit(
    ruleId: string,
    params: Partial<UpdateRateLimitRuleParams>, // Allow partial updates
  ): Promise<Result<RateLimitRuleView, string>> {
    // Validate the input parameters using the partial Zod schema
    const validationResult = UpdateRateLimitRuleSchema.safeParse(params);
    if (!validationResult.success) {
      return err(
        validationResult.error.errors.map((e) => e.message).join(", "),
      );
    }

    // Use only the validated parameters for the update
    const validatedParams = validationResult.data;

    // Check if there are any valid parameters to update
    if (Object.keys(validatedParams).length === 0) {
      return err("No valid fields provided for update.");
    }

    // Map validated API params to DB Update type for the store
    const dbParams: UpdateOrgRateLimitDBStore = {
      ...validatedParams,
      segment:
        validatedParams.segment === undefined ? null : validatedParams.segment,
    };

    const result = await this.rateLimitStore.updateRateLimit(
      ruleId,
      this.authParams.organizationId,
      dbParams, // Pass validated & mapped DB update params
    );
    if (result.error || !result.data) {
      return err(result.error || "Failed to update rate limit rule");
    }
    return ok(this.mapDbToView(result.data));
  }

  // No change in signature or return type needed here
  async deleteRateLimit(ruleId: string): Promise<Result<null, string>> {
    const result = await this.rateLimitStore.softDeleteRateLimit(
      ruleId,
      this.authParams.organizationId,
    );
    return result;
  }
}
