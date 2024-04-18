import { ChevronDoubleDownIcon } from "@heroicons/react/24/outline";
import { Badge } from "@tremor/react";

interface HcBadgeProps {
  title: string;
  size: "sm" | "md" | "lg";
  icon?: React.ForwardRefExoticComponent<
    Omit<React.SVGProps<SVGSVGElement>, "ref"> & {
      title?: string | undefined;
      titleId?: string | undefined;
    } & React.RefAttributes<SVGSVGElement>
  >;
}

const HcBadge = (props: HcBadgeProps) => {
  const { title, size, icon } = props;

  if (icon) {
    return (
      <Badge icon={icon} size={size}>
        {title}
      </Badge>
    );
  }

  return <Badge size={size}>{title}</Badge>;
};

export default HcBadge;
