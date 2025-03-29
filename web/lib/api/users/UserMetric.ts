import { useUsers } from "@/services/hooks/users";

type NotNullOrUndefined<T> = T extends null | undefined ? never : T;

export type UserMetric = NotNullOrUndefined<
  NotNullOrUndefined<
    NotNullOrUndefined<
      Awaited<ReturnType<typeof useUsers>>["userMetrics"]["data"]
    >["data"]
  >["data"]
>["users"][number];
