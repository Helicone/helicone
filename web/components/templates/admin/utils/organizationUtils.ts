export interface OrganizationMember {
  id: string;
  email: string;
  name: string;
  role: string;
  last_sign_in_at: string | null;
}

export const getOwnerFromMembers = (
  members: OrganizationMember[]
): { name: string; email: string } => {
  return (
    members.find((member) => member?.role?.toLowerCase() === "owner") || {
      name: "N/A",
      email: "N/A",
    }
  );
};

export const sortAndFormatMonthlyUsage = (monthlyUsage: any[]) => {
  return monthlyUsage
    .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
    .map((item) => ({
      ...item,
      month: new Date(item.month).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
      }),
      requestCount: item.requestCount,
    }));
};
