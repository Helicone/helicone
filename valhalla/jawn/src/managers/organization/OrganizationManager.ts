import { ENVIRONMENT } from "../../lib/clients/constant";
import { Database } from "../../lib/db/database.types";
import { getHeliconeAuthClient } from "../../packages/common/auth/server/AuthClientFactory";
import { AuthParams } from "../../packages/common/auth/types";
import { dbExecute } from "../../lib/shared/db/dbExecute";
import { err, ok, Result } from "../../packages/common/result";
import { OrganizationStore } from "../../lib/stores/OrganizationStore";
import { BaseManager } from "../BaseManager";
import crypto from "crypto";

export type NewOrganizationParams =
  Database["public"]["Tables"]["organization"]["Insert"];

export type UpdateOrganizationParams = Pick<
  NewOrganizationParams,
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
  ): Promise<Result<NewOrganizationParams, string>> {
    if (!this.authParams.userId) return err("Unauthorized");
    if (createOrgParams.owner !== this.authParams.userId) {
      return err("Unauthorized");
    }

    const organizationType = createOrgParams.organization_type ?? "user";
    if (!CREATABLE_ORGANIZATION_TYPES.includes(organizationType)) {
      return err("Invalid organization type");
    }

    if (createOrgParams.tier !== "free") {
      return err("Only free tier is supported");
    }

    // INC-710: org_provider_key attaches a stored provider key to every
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

    const insert = await this.organizationStore.createNewOrganization(
      {
        ...createOrgParams,
        organization_type: organizationType,
        org_provider_key: orgProviderKey,
      },
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
    if (!this.authParams.userId) return err("Unauthorized");
    // INC-710: the provider key attached to an organization is fixed at
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

  async addMember(
    organizationId: string,
    email: string
  ): Promise<Result<{ userId: string; temporaryPassword?: string }, string>> {
    if (!this.authParams.userId) return err("Unauthorized");
    // Authorize before touching any user record: an unauthorized caller must
    // not be able to resolve emails to account ids or create accounts.
    if (
      (await this.organizationStore.checkAccessToMutateOrg(
        organizationId,
        this.authParams.userId
      )) === false
    ) {
      return err("User does not have access to add member to organization");
    }

    let { data: userId, error: userIdError } =
      await this.organizationStore.getUserByEmail(email);

    if (userIdError) {
      return err(userIdError);
    }
    let temporaryPassword: string | undefined;
    if (!userId || userId.length === 0) {
      try {
        // We still need to use the auth API for this specific function
        const authClient = getHeliconeAuthClient();
        if (process.env.NEXT_PUBLIC_BETTER_AUTH === "true") {
          temporaryPassword = crypto.randomBytes(18).toString("base64url");
        }
        const userResult = await authClient.createUser({
          email,
          password: temporaryPassword,
          otp: true,
        });
        if (userResult.error) {
          return err(userResult.error);
        }

        if (!userResult.data?.id) {
          return err("Failed to create user");
        }

        // we refetch the id since createUser can return a better auth format id (not a UUID)
        userId = userResult.data?.id ?? "";
        userIdError = null;
      } catch (error) {
        return err(`Failed to send OTP: ${error}`);
      }
    }

    if (userIdError) {
      return err(userIdError);
    }

    const { error: insertError } =
      await this.organizationStore.addMemberToOrganization(
        userId!,
        organizationId
      );

    if (insertError && insertError !== null) {
      return err(insertError);
    }

    return ok({ userId: userId!, temporaryPassword });
  }

  async updateMember(
    organizationId: string,
    orgRole: string,
    memberId: string
  ): Promise<Result<string, string>> {
    if (!this.authParams.userId) return err("Unauthorized");
    const hasAccess = await this.organizationStore.checkAccessToMutateOrg(
      organizationId,
      this.authParams.userId
    );
    if (!hasAccess) {
      return err("User does not have access to update member");
    }
    if (!organizationId || !orgRole || !memberId)
      return err("Invalid parameters");

    const { error: updateError } =
      await this.organizationStore.updateOrganizationMember(
        organizationId,
        this.authParams.userId,
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
    if (!this.authParams.userId) return err("Unauthorized");
    const isUserOwner = await this.organizationStore.isUserOwner(
      organizationId,
      this.authParams.userId
    );
    if (!isUserOwner) {
      return err("User does not have access to update member");
    }
    if (!organizationId || !memberId) return err("Invalid parameters");

    const { error: updateError } =
      await this.organizationStore.updateOrganizationOwner(
        organizationId,
        this.authParams.userId,
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

  async removeOrganizationMember(
    organizationId: string,
    memberId: string
  ): Promise<Result<string, string>> {
    if (!this.authParams.userId) return err("Unauthorized");
    const hasAccess = await this.organizationStore.checkAccessToMutateOrg(
      organizationId,
      this.authParams.userId
    );
    if (!hasAccess) {
      return err(
        "User does not have access to remove member from organization"
      );
    }

    const { error: deleteError } =
      await this.organizationStore.removeMemberFromOrganization(
        organizationId,
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
    if (!this.authParams.userId) return err("Unauthorized");
    const hasAccess = await this.organizationStore.checkAccessToMutateOrg(
      this.authParams.organizationId,
      this.authParams.userId
    );

    if (!hasAccess) {
      return err("User does not have access to delete organization");
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
