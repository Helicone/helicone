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
  ];
  return columns.map((property) => {
    return {
      id: property,
      accessorFn: (row: any) => {
        const value = row.metadata ? row.metadata[property] : "";
        return value;
      },
      cell: ({ row }: any) => {
        return row.original.metadata[property];
      },
    };
  });
};
