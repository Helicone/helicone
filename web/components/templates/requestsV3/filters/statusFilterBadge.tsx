import ListFilterBadge from "./shared/listFilterBadge";

interface StatusFilterBadgeProps {}

const StatusFilterBadge = (props: StatusFilterBadgeProps) => {
  const {} = props;

  return (
    <ListFilterBadge
      listKey={"status"}
      options={[
        { label: "Success (200)", value: "200" },
        { label: "400", value: "400" },
        { label: "404", value: "404" },
        { label: "500", value: "500" },
      ]}
    />
  );
};

export default StatusFilterBadge;
