export const getColumns = () => {
  const columns = [
    "session_name",
    "session_id",
    "created_at",
    "latest_request_created_at",
    "total_cost",
    "prompt_tokens",
    "completion_tokens",
    "total_tokens",
    "total_requests",
    "avg_latency",
    "user_ids",
  ];
  return columns.map((property) => {
    return {
      id: property,
      accessorFn: (row: any) => {
        const value = row.metadata ? row.metadata[property] : "";
        return value;
      },
      cell: ({ row }: any) => {
        const value = row.original.metadata[property];
        // Format arrays as comma-separated strings
        if (Array.isArray(value)) {
          const filtered = value.filter((v: string) => v && v.trim() !== "");
          return filtered.length > 0 ? filtered.join(", ") : "-";
        }
        return value;
      },
    };
  });
};
