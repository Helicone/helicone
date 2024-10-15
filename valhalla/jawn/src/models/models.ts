import { ProviderName } from "../packages/cost/providers/mappings";

export type Provider = ProviderName | "CUSTOM" | string;
export type KeyPermissions = "w" | "rw" | undefined;
export type Role = "admin" | "owner" | "member" | undefined;
