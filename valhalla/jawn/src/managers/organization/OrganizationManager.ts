import { ENVIRONMENT } from "../../lib/clients/constant";
import { Database } from "../../lib/db/database.types";
import { AuthParams, supabaseServer } from "../../lib/db/supabase";
import { ok, err, Result } from "../../lib/shared/result";
import { OrganizationStore } from "../../lib/stores/OrganizationStore";
import { BaseManager } from "../BaseManager";

export type NewOrganizationParams =
  Database["public"]["Tables"]["organization"]["Insert"];

export type UpdateOrganizationParams = Pick<
  NewOrganizationParams,
  | "name"
  | "color"
  | "icon"
  | "org_provider_key"
  | "limits"
  | "reseller_id"
  | "organization_type"
  | "onboarding_status"
> & {
  variant?: string;
};

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
};

export type OrganizationOwner = {
  email: string;
  tier: string;
};

export type OnboardingStatus = Partial<{
  currentStep: string;
  selectedTier: string;
  hasOnboarded: boolean;
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
    return supabaseServer.client
      .from("organization")
      .select("*")
      .eq("id", this.authParams.organizationId)
      .single();
  }

  async createOrganization(
    createOrgParams: NewOrganizationParams
  ): Promise<Result<NewOrganizationParams, string>> {
    if (!this.authParams.userId) return err("Unauthorized");
    if (createOrgParams.owner !== this.authParams.userId) {
      return err("Unauthorized");
    }

    if (createOrgParams.organization_type === "customer") {
      const org = await this.getOrg();
      if (org.data?.organization_type !== "reseller") {
        return err("Only resellers can create customers");
      }
    }

    if (createOrgParams.tier !== "free") {
      return err("Only free tier is supported");
    }
    const insert = await this.organizationStore.createNewOrganization(
      createOrgParams
    );
    if (insert.error || !insert.data) {
      return err(insert.error);
    }
    return ok(insert.data);
  }

  async updateOrganization(
    updateOrgParams: UpdateOrganizationParams,
    organizationId: string
  ): Promise<Result<string, string>> {
    if (!this.authParams.userId) return err("Unauthorized");
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
  ): Promise<Result<string, string>> {
    if (!this.authParams.userId) return err("Unauthorized");
    let { data: userId, error: userIdError } =
      await this.organizationStore.getUserByEmail(email);

    if (userIdError) {
      return err(userIdError);
    }
    if (!userId || userId.length === 0) {
      await supabaseServer.client.auth.signInWithOtp({ email });
      const result = await this.organizationStore.getUserByEmail(email);
      userId = result.data;
      userIdError = result.error;
    }

    if (userIdError) {
      return err(userIdError);
    }
    if (
      (await this.organizationStore.checkAccessToMutateOrg(
        organizationId,
        this.authParams.userId
      )) === false
    ) {
      return err("User does not have access to add member to organization");
    }

    const { error: insertError } =
      await this.organizationStore.addMemberToOrganization(
        userId!,
        organizationId
      );

    if (insertError && insertError !== null) {
      return err(insertError);
    }

    return ok(userId!);
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
    const { data: superUsers, error: adminsError } = await supabaseServer.client
      .from("admins")
      .select("*");

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
    name: string,
    hasOnboarded: boolean
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
      name,
      hasOnboarded
    );

    if (error || !data) {
      console.error(`Failed to update onboarding status: ${error}`);
      return err(`Failed to update onboarding status: ${error}`);
    }

    return ok(data);
  }
}
