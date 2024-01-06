import { useUser } from "@supabase/auth-helpers-react";
import { Database } from "../../../../supabase/database.types";
import {
  useGetOrgMembers,
  useGetOrgOwner,
} from "../../../../services/hooks/organizations";
import { useState } from "react";
import OrgMemberItem from "../orgMemberItem";
import { useOrg } from "../../../shared/layout/organizationContext";
import AddMemberModal from "../addMemberModal";
import { Card, Flex, ProgressCircle, Badge } from "@tremor/react";
import {
  BuildingOffice2Icon,
  CloudArrowUpIcon,
  CreditCardIcon,
} from "@heroicons/react/24/outline";
import { clsx } from "../../../shared/clsx";
import UpgradeProModal from "../../../shared/upgradeProModal";
import Link from "next/link";
import useNotification from "../../../shared/notification/useNotification";

interface OrgMembersPageProps {
  org: Database["public"]["Tables"]["organization"]["Row"];
}

const OrgMembersPage = (props: OrgMembersPageProps) => {
  const { org } = props;
  const { setNotification } = useNotification();
  const [open, setOpen] = useState(false);
  const { data, isLoading, refetch } = useGetOrgMembers(org.id);

  const { data: orgOwner, isLoading: isOrgOwnerLoading } = useGetOrgOwner(
    org.id
  );

  const orgContext = useOrg();

  const user = useUser();

  const [addOpen, setAddOpen] = useState(false);

  const onLeaveSuccess = () => {
    const ownedOrgs = orgContext?.allOrgs.filter(
      (org) => org.owner === user?.id
    );
    if (orgContext && ownedOrgs && ownedOrgs.length > 0) {
      orgContext.refetchOrgs();
      orgContext.setCurrentOrg(ownedOrgs[0].id);
    }
  };

  const isOwner = org.owner === user?.id;

  const members = data?.data
    ? data?.data
        .filter((d) => {
          // if the org is a customer org, remove all "owner" roles UNLESS the user is the owner
          if (orgContext?.currentOrg?.organization_type === "customer") {
            return d.org_role !== "owner";
          } else {
            return true;
          }
        })
        .map((d) => {
          return {
            ...d,
            org_role: d.org_role === "owner" ? "admin" : d.org_role,
            isOwner: d.org_role === "owner",
          };
        })
    : [];

  const isUserAdmin =
    isOwner || members.find((m) => m.member === user?.id)?.org_role === "admin";

  let tierBadgeText = "";
  let maxSeats = 0;
  let tierColor = "";

  org.tier = "free";

  if (org.tier === "enterprise") {
    tierBadgeText = "Enterprise";
    tierColor = "purple";
    maxSeats = 100;
  } else if (org.tier === "pro") {
    tierBadgeText = "Pro";
    tierColor = "pink";
    maxSeats = 10;
  } else {
    tierBadgeText = "Free";
    tierColor = "";
    maxSeats = 5;
  }

  // Calculate the percentage of used seats
  const usedSeatsPercentage = members.length
    ? (members.length / maxSeats) * 100
    : 0;

  return (
    <>
      <div className="flex lg:flex-row flex-col md:space-x-4 space-y-4 pb-2 mb-4 justify-between">
        <div className="flex flex-col flex-auto text-gray-900 dark:text-gray-100 max-w-4xl w-full space-y-8">
          <div className="flex flex-col h-full space-y-4 w-full mt-8">
            <div className="flex flex-row justify-between items-center">
              <h3 className="text-lg font-semibold">Members</h3>

              <div className="flex flex-row space-x-4">
                <button
                  onClick={() => {
                    setAddOpen(true);
                  }}
                  className="items-center rounded-md bg-black dark:bg-white px-4 py-2 text-sm flex font-semibold text-white dark:text-black shadow-sm hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  Invite Members
                </button>
              </div>
            </div>
            {isLoading || isOrgOwnerLoading ? (
              <ul className="flex flex-col space-y-6">
                {Array.from({ length: 3 }).map((_, index) => (
                  <li
                    key={index}
                    className="h-6 flex flex-row justify-between gap-2 bg-gray-500 animate-pulse rounded-md"
                  ></li>
                ))}
              </ul>
            ) : (
              <ul className="divide-y divide-gray-200 dark:divide-gray-800 border-t border-gray-200 dark:border-gray-800">
                {members.map((member, index) => (
                  <OrgMemberItem
                    key={index}
                    index={index}
                    orgMember={member}
                    orgId={org.id}
                    refetch={refetch}
                    isUserAdmin={isUserAdmin}
                    refreshOrgs={onLeaveSuccess}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="flex flex-auto">
          {isLoading || isOrgOwnerLoading ? (
            <Card className="w-full mx-auto animate-pulse">
              <Flex className="space-y-5 min-w-20">
                <div className="flex-1 space-y-6 py-1">
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="h-4 bg-slate-200 rounded col-span-2"></div>
                      <div className="h-4 bg-slate-200 rounded col-span-1"></div>
                    </div>
                    <div className="h-12 bg-slate-200 rounded"></div>
                    <div className="rounded-full bg-slate-200 h-40 w-40 mx-auto"></div>
                    <div className="h-24 bg-slate-200 rounded"></div>
                  </div>
                </div>
              </Flex>
            </Card>
          ) : (
            <Card className="w-full mx-auto">
              <Flex className="space-y-5 flex flex-col" justifyContent="center">
                <div>
                  <p>
                    <span className="font-semibold dark:text-white">
                      Organization Plan
                    </span>{" "}
                    <Badge size="md" color={tierColor}>
                      {tierBadgeText}
                    </Badge>
                  </p>
                  <p className="font-small text-gray-600 dark:text-gray-300">
                    This organization can only have {maxSeats} seats.{" "}
                    <button
                      onClick={() => setOpen(true)}
                      className="font-bold underline"
                    >
                      Upgrade
                    </button>{" "}
                    to add more.
                  </p>
                </div>
                <ProgressCircle
                  value={usedSeatsPercentage}
                  color={tierColor}
                  size="xl"
                >
                  <span className="text-xs text-gray-700 dark:text-gray-200 font-medium flex flex-col items-center">
                    {Math.round(usedSeatsPercentage)}%
                    <br />
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-normal">
                      {members.length} / {maxSeats} seats used
                    </span>
                  </span>
                </ProgressCircle>
                {/* Button to upgrade */}
                <div className="flex flex-col space-y-2">
                  {org.tier === "free" && (
                    <div className="relative flex items-center space-x-4 rounded-xl p-3 focus-within:ring-2 focus-within:ring-sky-500 hover:bg-gray-100 dark:hover:bg-gray-900">
                      <div
                        className={clsx(
                          "bg-pink-500",
                          "flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg"
                        )}
                      >
                        <CloudArrowUpIcon
                          className="h-6 w-6 text-white"
                          aria-hidden="true"
                        />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          <button
                            onClick={() => setOpen(true)}
                            className="focus:outline-none"
                          >
                            <span
                              className="absolute inset-0"
                              aria-hidden="true"
                            />
                            <span>Upgrade to Pro</span>
                            <span aria-hidden="true"> &rarr;</span>
                          </button>
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Unlimited requests and essential tooling for a low
                          price.
                        </p>
                      </div>
                    </div>
                  )}
                  {org.tier !== "free" && (
                    <div className="relative flex items-center space-x-4 rounded-xl p-3 focus-within:ring-2 focus-within:ring-sky-500 hover:bg-gray-100 dark:hover:bg-gray-900">
                      <div
                        className={clsx(
                          "bg-green-500",
                          "flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg"
                        )}
                      >
                        <CreditCardIcon
                          className="h-6 w-6 text-white dark:text-black"
                          aria-hidden="true"
                        />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          <button
                            className="focus:outline-none"
                            onClick={async () => {
                              const x = await fetch(
                                "/api/subscription/get_portal_link"
                              ).then((res) => res.json());
                              if (!x.data) {
                                setNotification("Error getting link", "error");
                                return;
                              }

                              window.open(x.data, "_blank");
                            }}
                          >
                            <span
                              className="absolute inset-0"
                              aria-hidden="true"
                            />
                            <span>Manage Plan</span>
                            <span aria-hidden="true"> &rarr;</span>
                          </button>
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Unlimited requests and essential tooling for a low
                          price.
                        </p>
                      </div>
                    </div>
                  )}
                  {org.tier !== "enterprise" && (
                    <div className="relative flex items-center space-x-4 rounded-xl p-3 focus-within:ring-2 focus-within:ring-sky-500 hover:bg-gray-100 dark:hover:bg-gray-900">
                      <div
                        className={clsx(
                          "bg-purple-500",
                          "flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg"
                        )}
                      >
                        <BuildingOffice2Icon
                          className="h-6 w-6 text-white"
                          aria-hidden="true"
                        />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          <Link
                            className="focus:outline-none"
                            href={
                              "https://calendly.com/d/x5d-9q9-v7x/helicone-discovery-call"
                            }
                          >
                            <span
                              className="absolute inset-0"
                              aria-hidden="true"
                            />
                            <span>Enterprise</span>
                            <span aria-hidden="true"> &rarr;</span>
                          </Link>
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Need a custom plan? Contact us to learn more.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </Flex>
            </Card>
          )}
        </div>
      </div>
      <UpgradeProModal open={open} setOpen={setOpen} />
      <AddMemberModal
        orgId={org.id}
        orgOwnerId={org.owner}
        open={addOpen}
        setOpen={setAddOpen}
        onSuccess={() => {
          refetch();
        }}
      />
    </>
  );
};

export default OrgMembersPage;
