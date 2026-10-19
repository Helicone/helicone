import { ENVIRONMENT } from "../../lib/clients/constant";
import { Database } from "../../lib/db/database.types";
import { getHeliconeAuthClient } from "../../packages/common/auth/server/AuthClientFactory";
import { AuthParams } from "../../packages/common/auth/types";
import { dbExecute } from "../../lib/shared/db/dbExecute";
import { err, ok, Result } from "../../packages/common/result";
import { OrganizationStore } from "../../lib/stores/OrganizationStore";
import { BaseManager } from "../BaseManager";
import {
  authorizeOrgActor,
  getVerifiedOrgRole,
  isAssignableMemberRole,
  ORG_ADMIN_ROLES,
  ORG_OWNER_ROLES,
  OrgAuthzError,
} from "../../utils/orgAuthz";

type OrganizationInsert = Database["public"]["Tables"]["organization"]["Insert"];
type OrganizationRow = Database["public"]["Tables"]["organization"]["Row"];

export type OrganizationAddons = {
  prompts?: boolean;
  experiments?: boolean;
  evals?: boolean;
};

/**
 * Organization as returned to API clients. Billing identifiers and raw
 * stripe_metadata are omitted; the add-on flags are exposed as `addons`.
 */
export type ClientOrganization = Omit<
  OrganizationRow,
  | "stripe_customer_id"
  | "stripe_metadata"
  | "stripe_subscription_id"
  | "stripe_subscription_item_id"
> & {
  free_limit_exceeded?: string | null;
  addons: OrganizationAddons | null;
};

/** Customer organization as listed to its reseller. */
export type ResellerCustomerOrganization = Pick<
  OrganizationRow,
  "id" | "name" | "created_at" | "color" | "icon" | "tier" | "organization_type"
>;

/**
 * Fields a client may supply when creating an organization. Everything else
 * (owner, tier, billing identifiers, limits, flags) is set server-side.
 *
 * `owner`, `tier` and `has_integrated` are still accepted from older clients
 * but are validated or ignored, never written as given.
 */
export type NewOrganizationParams = Pick<
  OrganizationInsert,
  "name" | "color" | "icon" | "organization_type" | "org_provider_key"
> & {
  has_onboarded?: boolean;
  /** @deprecated Always the authenticated user. */
  owner?: string;
  /** @deprecated Always "free". */
  tier?: string | null;
  /** @deprecated Ignored. */
  has_integrated?: boolean;
};

/** The exact values written to the organization row on creation. */
export type OrganizationCreateRecord = {
  name: string;
  owner: string;
  color: string | null;
  icon: string | null;
  organization_type: string;
  org_provider_key: string | null;
  has_onboarded: boolean;
};

export type UpdateOrganizationParams = Pick<
  OrganizationInsert,
  | "name"
  | "color"
  | "icon"
  | "org_provider_key"
  | "limits"
  | "organization_type"
  | "onboarding_status"
  | "default_time_filter"
> & {
  variant?: string;
};

// Organization types a caller may create through the API. Reseller
// organizations are provisioned out of band.
const CREATABLE_ORGANIZATION_TYPES = ["user", "customer"];

export type FilterRow = {
  filterMapIdx: number;
  operatorIdx: number;
  value: string;
};

export interface UIFilterRowNode {
  operator: "and" | "or";
  rows: UIFilterRowTree[];
}

export type UIFilterRowTree = UIFilterRowNode | FilterRow;

export type OrganizationFilter = {
  id: string;
  name: string;
  filter: UIFilterRowTree[];
  createdAt?: string;
  softDelete: boolean;
};

export type OrganizationLayout = {
  id: string;
  organization_id: string;
  type: string;
  filters: OrganizationFilter[];
};

export type OrganizationMember = {
  email: string;
  member: string;
  org_role: string;
  created_at: string;
};

export type OrganizationOwner = {
  email: string;
  tier: string;
};

export type OnboardingStatus = Partial<{
  currentStep: string;
  selectedTier: string;
  hasOnboarded: boolean;
  hasIntegrated: boolean;
  hasCompletedQuickstart: boolean;
  members: any[];
  addons: {
    prompts: boolean;
    experiments: boolean;
    evals: boolean;
  };
}>;

export class OrganizationManager extends BaseManager {
  private organizationStore: OrganizationStore;
  constructor(authParams: AuthParams) {
    super(authParams);
    this.organizationStore = new OrganizationStore(authParams.organizationId);
  }

  async getOrg() {
    try {
      const result = await dbExecute<
        Database["public"]["Tables"]["organization"]["Row"]
      >(
        `SELECT *
         FROM organization
         WHERE id = $1
         LIMIT 1`,
        [this.authParams.organizationId]
      );

      if (result.error || !result.data || result.data.length === 0) {
        return { data: null, error: result.error ?? "Organization not found" };
      }

      return { data: result.data[0], error: null };
    } catch (error) {
      return { data: null, error: `Failed to get organization: ${error}` };
    }
  }

  async createOrganization(
    createOrgParams: NewOrganizationParams
  ): Promise<Result<{ id: string }, string>> {
    // Creating an organization makes the caller its owner, so the caller must
    // be a real user session, not an API key carrying a stored user id.
    if (this.authParams.authType !== "jwt" || !this.authParams.userId) {
      return err("Unauthorized");
    }
    if (
      createOrgParams.owner !== undefined &&
      createOrgParams.owner !== this.authParams.userId
    ) {
      return err("Unauthorized");
    }

    const organizationType = createOrgParams.organization_type ?? "user";
    if (!CREATABLE_ORGANIZATION_TYPES.includes(organizationType)) {
      return err("Invalid organization type");
    }

    if (
      createOrgParams.tier !== undefined &&
      createOrgParams.tier !== null &&
      createOrgParams.tier !== "free"
    ) {
      return err("Only free tier is supported");
    }

    if (!createOrgParams.name || createOrgParams.name.trim() === "") {
      return err("Organization name is required");
    }

    // org_provider_key attaches a stored provider key to every
    // request made with this organization's customer-portal API keys. It may
    // only be set when a reseller creates a customer organization, and only to
    // a provider key the reseller organization itself owns. The reseller is
    // always the caller's current organization, never a request-body value.
    let resellerId: string | null = null;
    if (organizationType === "customer") {
      const reseller = await this.authorizeResellerCaller();
      if (reseller.error !== null) {
        return err(reseller.error);
      }
      resellerId = reseller.data;
    }

    const orgProviderKey = createOrgParams.org_provider_key ?? null;
    if (orgProviderKey !== null) {
      if (resellerId === null) {
        return err(
          "org_provider_key can only be set by a reseller on a customer organization"
        );
      }
      const owned = await this.organizationStore.isProviderKeyOwnedByOrg(
        orgProviderKey,
        resellerId
      );
      if (owned.error !== null) {
        return err(owned.error);
      }
      if (!owned.data) {
        return err("Provider key not found");
      }
    }

    // Build the row from an explicit allowlist. Billing identifiers
    // (stripe_*), limits, tier and ownership are never taken from the client.
    const record: OrganizationCreateRecord = {
      name: createOrgParams.name,
      owner: this.authParams.userId,
      color: createOrgParams.color ?? null,
      icon: createOrgParams.icon ?? null,
      organization_type: organizationType,
      org_provider_key: orgProviderKey,
      has_onboarded: createOrgParams.has_onboarded === true,
    };

    const insert = await this.organizationStore.createNewOrganization(
      record,
      resellerId
    );
    if (insert.error || !insert.data) {
      return err(insert.error);
    }
    return ok(insert.data);
  }

  /**
   * Confirms the caller is acting from a reseller organization they
   * administer and returns that organization's id.
   */
  private async authorizeResellerCaller(): Promise<Result<string, string>> {
    if (!this.authParams.userId) return err("Unauthorized");
    const org = await this.getOrg();
    if (
      org.error ||
      !org.data ||
      org.data.organization_type !== "reseller" ||
      org.data.soft_delete
    ) {
      return err("Only resellers can create customers");
    }
    const member = await this.organizationStore.getOrganizationMember(
      this.authParams.userId,
      org.data.id
    );
    if (
      member.error !== null ||
      !member.data ||
      (member.data.org_role !== "owner" && member.data.org_role !== "admin")
    ) {
      return err("Only reseller admins can create customers");
    }
    return ok(org.data.id);
  }

  async updateOrganization(
    updateOrgParams: UpdateOrganizationParams,
    organizationId: string
  ): Promise<Result<string, string>> {
    // Only a signed-in user may change organization settings; an API key's
    // stored user_id is not proof of identity.
    if (this.authParams.authType !== "jwt" || !this.authParams.userId) {
      return err("Unauthorized");
    }
    // The provider key attached to an organization is fixed at
    // creation by its reseller and is never updatable by clients.
    if (
      updateOrgParams.org_provider_key !== undefined &&
      updateOrgParams.org_provider_key !== null
    ) {
      return err("org_provider_key cannot be updated");
    }
    const hasAccess = await this.organizationStore.checkAccessToMutateOrg(
      organizationId,
      this.authParams.userId
    );
    if (!hasAccess) {
      return err("User does not have access to update organization");
    }
    const orgMember = await this.organizationStore.getOrganizationMember(
      this.authParams.userId,
      organizationId
    );

    if (!orgMember.data) {
      return err("Unauthorized");
    }

    if (
      orgMember.data.org_role !== "owner" &&
      orgMember.data.org_role !== "admin"
    ) {
      return err("Only organization admins can update settings");
    }

    const { data, error } = await this.organizationStore.updateOrganization(
      updateOrgParams,
      organizationId
    );

    if (error || !data || data.length === 0) {
      console.error(`Failed to update organization: ${error}`);
      return err(`Failed to update organization: ${error}`);
    }
    return ok(data);
  }

  /**
   * Authorizes a membership change on `organizationId`. The organization must
   * be the one the caller authenticated against, the caller must be signed in
   * (JWT), and the caller's role is re-read from the database.
   */
  async authorizeMemberManagement(
    organizationId: string,
    allowedRoles = ORG_ADMIN_ROLES
  ) {
    return authorizeOrgActor(this.authParams, allowedRoles, organizationId);
  }

  async addMember(
    organizationId: string,
    email: string
  ): Promise<Result<{ userId: string }, string>> {
    // Authorize before touching any user record: an unauthorized caller must
    // not be able to resolve emails to account ids or create accounts.
    const actor = await this.authorizeMemberManagement(organizationId);
    if (actor.error !== null) {
      return err(actor.error.message);
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      return err("Invalid email");
    }

    let { data: userId, error: userIdError } =
      await this.organizationStore.getUserByEmail(normalizedEmail);

    if (userIdError) {
      return err(userIdError);
    }
    if (!userId || userId.length === 0) {
      // Never mint accounts or credentials on someone else's behalf.
      // Supabase mode sends the invitee a sign-in email (no credential is
      // returned to the caller); other auth modes require the person to sign
      // up first.
      if (process.env.NEXT_PUBLIC_BETTER_AUTH === "true") {
        return err(
          "No Helicone account exists for this email. Ask them to sign up first, then add them."
        );
      }
      try {
        const userResult = await getHeliconeAuthClient().createUser({
          email: normalizedEmail,
          otp: true,
        });
        if (userResult.error || !userResult.data?.id) {
          return err(userResult.error ?? "Failed to invite user");
        }
        userId = userResult.data.id;
      } catch (error) {
        return err(`Failed to send invite: ${error}`);
      }
    }

    const { error: insertError } =
      await this.organizationStore.addMemberToOrganization(
        userId!,
        actor.data.organizationId
      );

    if (insertError && insertError !== null) {
      return err(insertError);
    }

    return ok({ userId: userId! });
  }

  async updateMember(
    organizationId: string,
    orgRole: string,
    memberId: string
  ): Promise<Result<string, string>> {
    if (!organizationId || !orgRole || !memberId)
      return err("Invalid parameters");

    const actor = await this.authorizeMemberManagement(organizationId);
    if (actor.error !== null) {
      return err(actor.error.message);
    }

    if (!isAssignableMemberRole(orgRole)) {
      return err("Invalid role. Allowed roles: member, admin");
    }
    if (memberId === actor.data.userId) {
      return err("You cannot change your own role");
    }
    if (memberId === actor.data.ownerId) {
      return err(
        "The organization owner's role cannot be changed. Transfer ownership instead."
      );
    }

    const target = await getVerifiedOrgRole(
      actor.data.organizationId,
      memberId
    );
    if (target.error !== null) {
      return err("Error checking member role");
    }
    if (!target.data) {
      return err("User is not a member of this organization");
    }
    if (target.data.role === "admin" && actor.data.role !== "owner") {
      return err("Only the organization owner can change an admin's role");
    }

    const { error: updateError } =
      await this.organizationStore.updateOrganizationMember(
        actor.data.organizationId,
        orgRole,
        memberId
      );

    if (updateError) {
      return err(updateError);
    }
    return ok("success");
  }

  async updateOwner(
    organizationId: string,
    memberId: string
  ): Promise<Result<string, string>> {
    if (!organizationId || !memberId) return err("Invalid parameters");
    const actor = await this.authorizeMemberManagement(
      organizationId,
      ORG_OWNER_ROLES
    );
    if (actor.error !== null) {
      return err(actor.error.message);
    }
    if (memberId === actor.data.userId) {
      return err("You already own this organization");
    }

    const { error: updateError } =
      await this.organizationStore.updateOrganizationOwner(
        actor.data.organizationId,
        actor.data.userId,
        memberId
      );

    if (updateError) {
      return err(updateError);
    }
    return ok("success");
  }

  async getOrganizationOwner(
    organizationId: string
  ): Promise<Result<OrganizationOwner[], string>> {
    if (!this.authParams.userId) return err("Unauthorized");

    const { data: owner, error: ownerError } =
      await this.organizationStore.getOrganizationOwner(
        organizationId,
        this.authParams.userId
      );

    if (ownerError || !owner) {
      return err(ownerError);
    }
    return ok(owner);
  }

  /**
   * Checks that the caller may remove `memberId` from `organizationId`:
   *  - the owner can never be removed;
   *  - any member may remove themselves (leave);
   *  - removing someone else requires admin, and removing an admin requires
   *    the owner.
   */
  async authorizeMemberRemoval(
    organizationId: string,
    memberId: string
  ): Promise<Result<{ organizationId: string }, OrgAuthzError>> {
    const actor = await this.authorizeMemberManagement(organizationId, [
      "owner",
      "admin",
      "member",
    ]);
    if (actor.error !== null) {
      return err(actor.error);
    }
    if (!memberId) {
      return err({ status: 403, message: "Invalid member" });
    }
    if (memberId === actor.data.ownerId) {
      return err({
        status: 403,
        message:
          "The organization owner cannot be removed. Transfer ownership first.",
      });
    }
    if (memberId !== actor.data.userId) {
      if (actor.data.role === "member") {
        return err({
          status: 403,
          message: "Only organization owners and admins can remove members",
        });
      }
      const target = await getVerifiedOrgRole(
        actor.data.organizationId,
        memberId
      );
      if (target.error !== null) {
        return err({ status: 500, message: "Error checking member role" });
      }
      if (!target.data) {
        return err({
          status: 403,
          message: "User is not a member of this organization",
        });
      }
      if (target.data.role === "admin" && actor.data.role !== "owner") {
        return err({
          status: 403,
          message: "Only the organization owner can remove an admin",
        });
      }
    }
    return ok({ organizationId: actor.data.organizationId });
  }

  async removeOrganizationMember(
    organizationId: string,
    memberId: string
  ): Promise<Result<string, string>> {
    const authorized = await this.authorizeMemberRemoval(
      organizationId,
      memberId
    );
    if (authorized.error !== null) {
      return err(authorized.error.message);
    }

    const { error: deleteError } =
      await this.organizationStore.removeMemberFromOrganization(
        authorized.data.organizationId,
        memberId
      );

    if (deleteError) {
      return err(deleteError);
    }
    return ok("success");
  }

  async createFilter(
    organizationId: string,
    filters: OrganizationFilter[],
    filterType: "dashboard" | "requests"
  ): Promise<Result<string, string>> {
    if (!this.authParams.userId) return err("Unauthorized");
    const hasAccess = await this.organizationStore.checkUserBelongsToOrg(
      organizationId,
      this.authParams.userId
    );
    if (!hasAccess) {
      return err("User does not have access to create organization filter");
    }
    const insertRequest = {
      organization_id: organizationId,
      type: filterType,
      filters: filters,
    };

    const { data: createdFilter, error: createFilterError } =
      await this.organizationStore.createOrganizationFilter(insertRequest);

    if (createFilterError || !createdFilter) {
      console.error(`Failed to create filter: ${createFilterError}`);
      return err(`Failed to create filter: ${createFilterError}`);
    }

    return ok(createdFilter);
  }

  async updateFilter(
    organizationId: string,
    type: string,
    filters: OrganizationFilter[]
  ): Promise<Result<string, string>> {
    if (!this.authParams.userId) return err("Unauthorized");
    const hasAccess = await this.organizationStore.checkUserBelongsToOrg(
      organizationId,
      this.authParams.userId
    );
    if (!hasAccess) {
      return err("User does not have access to update organization filter");
    }
    const { error: updateError } =
      await this.organizationStore.updateOrganizationFilter(
        organizationId,
        type,
        filters
      );

    if (updateError) {
      return err(updateError);
    }
    return ok("success");
  }

  async deleteOrganization(): Promise<Result<string, string>> {
    // Deleting an organization is owner-only and requires a signed-in user.
    const actor = await authorizeOrgActor(this.authParams, ORG_OWNER_ROLES);
    if (actor.error !== null) {
      return err(actor.error.message);
    }
    const { data: orgData, error: orgError } =
      await this.organizationStore.deleteOrganization();

    if (orgError || !orgData) {
      return err(orgError ?? "Error deleting organization");
    }
    return ok(orgData);
  }

  async getOrganizationLayout(
    organizationId: string,
    filterType: string
  ): Promise<Result<OrganizationLayout, string>> {
    if (!this.authParams.userId) return err("Unauthorized");
    const hasAccess = await this.organizationStore.checkUserBelongsToOrg(
      organizationId,
      this.authParams.userId
    );

    if (!hasAccess) {
      return err("User does not have access to get organization layout");
    }
    const { data: layout, error: organizationLayoutError } =
      await this.organizationStore.getOrganizationLayout(
        organizationId,
        filterType
      );

    if (organizationLayoutError !== null) {
      return ok({ filters: [], id: "", organization_id: "", type: "" });
    }
    return ok(layout);
  }

  async getMemberCount(
    filterHeliconeEmails: boolean = false
  ): Promise<Result<number, string>> {
    const { data: members, error: membersError } =
      await this.organizationStore.getOrganizationMembers(
        this.authParams.organizationId
      );

    if (membersError !== null) {
      return err(membersError);
    }
    if (filterHeliconeEmails && ENVIRONMENT === "production") {
      return ok(
        members.filter((member) => !member.email.endsWith("@helicone.ai"))
          .length
      );
    } else {
      return ok(members.length);
    }
  }

  async getOrganizationMembers(
    organizationId: string
  ): Promise<Result<OrganizationMember[], string>> {
    if (!this.authParams.userId) return err("Unauthorized");
    const hasAccess = await this.organizationStore.checkUserBelongsToOrg(
      organizationId,
      this.authParams.userId
    );

    if (!hasAccess) {
      return err("User does not have access to get organization members");
    }

    const superUsersResult = await dbExecute<{ user_id: string }>(
      `SELECT *
       FROM admins`,
      []
    );

    const superUsers = superUsersResult.data || [];

    const { data: members, error: membersError } =
      await this.organizationStore.getOrganizationMembers(organizationId);
    if (membersError !== null) {
      return err(membersError);
    }
    if (
      this.authParams.userId &&
      superUsers?.some(
        (superUser) => superUser.user_id === this.authParams.userId
      )
    ) {
      return ok(members);
    }

    return ok(
      members.filter(
        (member) =>
          !superUsers?.some((superUser) => superUser.user_id === member.member)
      )
    );
  }

  async setupDemo(organizationId: string): Promise<Result<null, string>> {
    if (!this.authParams.userId) return err("Unauthorized");
    const hasAccess = await this.organizationStore.checkUserBelongsToOrg(
      organizationId,
      this.authParams.userId
    );

    if (!hasAccess) {
      return err("User does not have access to setup demo");
    }

    const { data: org, error: orgError } =
      await this.organizationStore.setupDemo(
        this.authParams.userId,
        organizationId
      );

    if (orgError) {
      return err(orgError ?? "Error setting up demo");
    }
    return ok(null);
  }

  async updateOnboardingStatus(
    organizationId: string,
    onboardingStatus: OnboardingStatus,
    name: string
  ): Promise<Result<string, string>> {
    if (!this.authParams.userId) return err("Unauthorized");

    const hasAccess = await this.organizationStore.checkUserBelongsToOrg(
      organizationId,
      this.authParams.userId
    );

    if (!hasAccess) {
      return err(
        "User does not have access to update organization onboarding status"
      );
    }

    const { data, error } = await this.organizationStore.updateOnboardingStatus(
      onboardingStatus,
      name
    );

    if (error || !data) {
      console.error(`Failed to update onboarding status: ${error}`);
      return err(`Failed to update onboarding status: ${error}`);
    }

    return ok(data);
  }
}
