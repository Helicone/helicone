import {
  BuildingOfficeIcon,
  CakeIcon,
  CloudIcon,
  CommandLineIcon,
  RocketLaunchIcon,
  CpuChipIcon,
  ScaleIcon,
  Square3Stack3DIcon,
} from "@heroicons/react/24/outline";

type OrgIconType = {
  name:
    | "building"
    | "cake"
    | "cloud"
    | "rocket"
    | "code"
    | "chip"
    | "scale"
    | "stack";
  icon: React.ForwardRefExoticComponent<
    React.SVGProps<SVGSVGElement> & {
      title?: string | undefined;
      titleId?: string | undefined;
    }
  >;
};

export const ORGANIZATION_ICONS: OrgIconType[] = [
  {
    name: "building",
    icon: BuildingOfficeIcon,
  },
  {
    name: "cake",
    icon: CakeIcon,
  },
  {
    name: "cloud",
    icon: CloudIcon,
  },
  {
    name: "rocket",
    icon: RocketLaunchIcon,
  },
  {
    name: "code",
    icon: CommandLineIcon,
  },
  {
    name: "chip",
    icon: CpuChipIcon,
  },
  {
    name: "scale",
    icon: ScaleIcon,
  },
  {
    name: "stack",
    icon: Square3Stack3DIcon,
  },
];

export const ORGANIZATION_COLORS = [
  {
    name: "gray",
    bgColor: "bg-gray-200",
    textColor: "text-gray-800",
    selectedColor: "ring-gray-500",
  },
  {
    name: "red",
    bgColor: "bg-red-300",
    textColor: "text-red-800",
    selectedColor: "ring-red-500",
  },
  {
    name: "yellow",
    bgColor: "bg-yellow-200",
    textColor: "text-yellow-800",
    selectedColor: "ring-yellow-500",
  },
  {
    name: "green",
    bgColor: "bg-green-300",
    textColor: "text-green-800",
    selectedColor: "ring-green-500",
  },
  {
    name: "blue",
    bgColor: "bg-blue-300",
    textColor: "text-blue-800",
    selectedColor: "ring-blue-500",
  },
  {
    name: "purple",
    bgColor: "bg-purple-300",
    textColor: "text-purple-800",
    selectedColor: "ring-purple-500",
  },
];
