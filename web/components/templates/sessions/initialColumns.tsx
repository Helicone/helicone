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

const convertToUSDateFormat = (date: string) => {
  const dateObj = new Date(date);
  const tzOffset = dateObj.getTimezoneOffset() * 60000;

  const localDateObj = new Date(dateObj.getTime() - tzOffset);
  const formattedDate =
    [
      ("0" + (localDateObj.getMonth() + 1)).slice(-2),
      ("0" + localDateObj.getDate()).slice(-2),
      localDateObj.getFullYear(),
    ].join("/") +
    " " +
    [
      ("0" + localDateObj.getHours()).slice(-2),
      ("0" + localDateObj.getMinutes()).slice(-2),
      ("0" + localDateObj.getSeconds()).slice(-2),
    ].join(":");

  return formattedDate;
};
