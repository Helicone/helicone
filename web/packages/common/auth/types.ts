import { PromiseGenericResult } from "../result";

export type JwtAuth = {
  _type: "jwt";
  token: string;
  orgId?: string;
};
export type BearerAuthProxy = {
  _type: "bearerProxy";
  token: string;
};
export type BearerAuth = {
  _type: "bearer";
  token: string;
};

export type HeliconeAuth = JwtAuth | BearerAuthProxy | BearerAuth;
export type Role = "admin" | "owner" | "member" | undefined;
export type KeyPermissions = "w" | "rw" | undefined;

export interface AuthParams {
  organizationId: string;
  userId?: string;
  heliconeApiKeyId?: number;
  keyPermissions?: KeyPermissions;
  role?: Role;
}
export type AuthResult = PromiseGenericResult<AuthParams>;

export interface OrgParams {
  tier: string;
  id: string;
  percentLog: number;
  has_onboarded: boolean;
}

export type OrgResult = PromiseGenericResult<OrgParams>;

export interface HeliconeUser {
  email: string;
  id: string;
  user_metadata?: {
    name?: string;
    avatar_url?: string;
  };
}

export type HeliconeUserResult = PromiseGenericResult<HeliconeUser>;

export type HeliconeOrg = {
  color: string;
  created_at: string | null;
  domain: string | null;
  governance_settings: any | null;
  gateway_discount_enabled: boolean;
  has_onboarded: boolean;
  has_integrated: boolean;
  icon: string;
  id: string;
  is_main_org: boolean;
  is_personal: boolean;
  limits: any | null;
  name: string;
  onboarding_status: any;
  org_provider_key: string | null;
  organization_type: string;
  owner: string;
  percent_to_log: number | null;
  playground_helicone: boolean;
  referral: string | null;
  request_limit: number | null;
  size: string | null;
  soft_delete: boolean;
  stripe_customer_id: string | null;
  stripe_metadata: any;
  stripe_subscription_id: string | null;
  stripe_subscription_item_id: string | null;
  subscription_status: string | null;
  tier: string | null;
  allow_negative_balance: boolean;
  credit_limit: number;
};
