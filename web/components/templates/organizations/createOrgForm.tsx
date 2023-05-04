import { RadioGroup } from "@headlessui/react";
import {
  BuildingOfficeIcon,
  CakeIcon,
  CloudIcon,
  CommandLineIcon,
  RocketLaunchIcon,
} from "@heroicons/react/24/outline";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { useState } from "react";
import { Database } from "../../../supabase/database.types";
import { clsx } from "../../shared/clsx";
import { useOrg } from "../../shared/layout/organizationContext";
import useNotification from "../../shared/notification/useNotification";

interface CreateOrgFormProps {
  setCreateOpen: (open: boolean) => void;
}

export const ORGANIZATION_COLORS = [
  {
    name: "gray",
    bgColor: "bg-gray-500",
    textColor: "text-gray-700",
    selectedColor: "ring-gray-500",
  },
  {
    name: "red",
    bgColor: "bg-red-500",
    textColor: "text-red-700",
    selectedColor: "ring-red-500",
  },
  {
    name: "yellow",
    bgColor: "bg-yellow-500",
    textColor: "text-yellow-700",
    selectedColor: "ring-yellow-500",
  },
  {
    name: "green",
    bgColor: "bg-green-500",
    textColor: "text-green-700",
    selectedColor: "ring-green-500",
  },
  {
    name: "blue",
    bgColor: "bg-blue-500",
    textColor: "text-blue-700",
    selectedColor: "ring-blue-500",
  },
  {
    name: "purple",
    bgColor: "bg-purple-500",
    textColor: "text-purple-700",
    selectedColor: "ring-purple-500",
  },
];

type OrgIconType = {
  name: "building" | "cake" | "cloud" | "rocket" | "code";
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
];

const CreateOrgForm = (props: CreateOrgFormProps) => {
  const { setCreateOpen } = props;
  const [orgName, setOrgName] = useState("");
  const [selectedColor, setSelectedColor] = useState(ORGANIZATION_COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState(ORGANIZATION_ICONS[0]);

  const user = useUser();
  const orgContext = useOrg();
  const { setNotification } = useNotification();
  const supabaseClient = useSupabaseClient<Database>();

  return (
    <div className="flex flex-col gap-4 w-full space-y-4">
      <p className="font-semibold text-lg">Create New Organization</p>
      <div className="space-y-1.5 text-sm w-[400px]">
        <label
          htmlFor="org-name"
          className="block text-sm font-medium leading-6 text-gray-900"
        >
          Organization Name
        </label>
        <input
          type="text"
          name="org-name"
          id="org-name"
          value={orgName}
          className={clsx(
            "block w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm"
          )}
          placeholder={"Your shiny new org name"}
          onChange={(e) => setOrgName(e.target.value)}
        />
      </div>
      <RadioGroup value={selectedColor} onChange={setSelectedColor}>
        <RadioGroup.Label className="block text-sm font-medium leading-6 text-gray-900">
          Choose a label color
        </RadioGroup.Label>
        <div className="mt-4 flex items-center justify-between px-8">
          {ORGANIZATION_COLORS.map((color) => (
            <RadioGroup.Option
              key={color.name}
              value={color}
              className={({ active, checked }) =>
                clsx(
                  color.selectedColor,
                  active && checked ? "ring ring-offset-1" : "",
                  !active && checked ? "ring-2" : "",
                  "relative -m-0.5 flex cursor-pointer items-center justify-center rounded-full p-0.5 focus:outline-none"
                )
              }
            >
              <RadioGroup.Label as="span" className="sr-only">
                {color.name}
              </RadioGroup.Label>
              <span
                aria-hidden="true"
                className={clsx(
                  color.bgColor,
                  "h-8 w-8 rounded-full border border-black border-opacity-10"
                )}
              />
            </RadioGroup.Option>
          ))}
        </div>
      </RadioGroup>
      <RadioGroup value={selectedIcon} onChange={setSelectedIcon}>
        <RadioGroup.Label className="block text-sm font-medium leading-6 text-gray-900">
          Choose an icon
        </RadioGroup.Label>
        <div className="mt-4 flex items-center justify-between px-8">
          {ORGANIZATION_ICONS.map((icon) => (
            <RadioGroup.Option
              key={icon.name}
              value={icon}
              className={({ active, checked }) =>
                clsx(
                  checked
                    ? "ring-2 ring-offset-1 ring-sky-300"
                    : "ring-1 ring-gray-200",
                  "bg-white rounded-md p-2"
                )
              }
            >
              <RadioGroup.Label as="span" className="sr-only">
                {icon.name}
              </RadioGroup.Label>
              {<icon.icon className="h-6 w-6" />}
            </RadioGroup.Option>
          ))}
        </div>
      </RadioGroup>
      <div className="w-full flex justify-end gap-4 mt-4">
        <button
          onClick={() => {
            setCreateOpen(false);
          }}
          className={clsx(
            "relative inline-flex items-center rounded-md hover:bg-gray-50 bg-white px-4 py-2 text-sm font-medium text-gray-700"
          )}
        >
          Cancel
        </button>
        <button
          onClick={async () => {
            if (!orgName || orgName === "") {
              setNotification("Please provide an organization name", "error");
              return;
            }
            const { data, error } = await supabaseClient
              .from("organization")
              .insert([
                {
                  name: orgName,
                  owner: user?.id!,
                  color: selectedColor.name,
                  icon: selectedIcon.name,
                },
              ])
              .select("*");
            if (error) {
              setNotification("Failed to create organization", "error");
            } else {
              setNotification("Organization created successfully", "success");
            }
            setCreateOpen(false);
            orgContext?.refetchOrgs();
          }}
          className={clsx(
            "relative inline-flex items-center rounded-md hover:bg-sky-400 bg-sky-500 px-4 py-2 text-sm font-medium text-white"
          )}
        >
          Create
        </button>
      </div>
    </div>
  );
};

export default CreateOrgForm;
