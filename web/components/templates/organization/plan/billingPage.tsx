import {
  BuildingOffice2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloudArrowUpIcon,
  CreditCardIcon,
  LightBulbIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import {
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  formatISO,
  isAfter,
} from "date-fns";
import { Database } from "../../../../supabase/database.types";
import useNotification from "../../../shared/notification/useNotification";
import { useState } from "react";
import { useGetRequestCountClickhouse } from "../../../../services/hooks/requests";
import Link from "next/link";
import { clsx } from "../../../shared/clsx";
import UpgradeProModal from "../../../shared/upgradeProModal";
import RenderOrgPlan from "./renderOrgPlan";
import { Result } from "../../../../lib/result";
import { useMutation, useQuery } from "@tanstack/react-query";
import AuthHeader from "@/components/shared/authHeader";
import HcBadge from "@/components/ui/hcBadge";
import { useOrg } from "@/components/layout/organizationContext";
import { getJawnClient } from "@/lib/clients/jawn";
import { Button } from "@/components/ui/button";

interface OrgPlanPageProps {}

const BillingPlanPage = (props: OrgPlanPageProps) => {
  const org = useOrg();
  const subscription = useQuery({
    queryKey: ["subscription", org?.currentOrg?.id],
    queryFn: async (query) => {
      const orgId = query.queryKey[1] as string;
      const jawn = getJawnClient(orgId);
      const subscription = await jawn.GET("/v1/stripe/subscription");
      return subscription;
    },
  });

  const upgradeToPro = useMutation({
    mutationFn: async () => {
      const jawn = getJawnClient(org?.currentOrg?.id);
      const result = await jawn.GET("/v1/stripe/subscription/upgrade-to-pro");
      return result;
    },
  });
  return (
    <>
      <AuthHeader
        title={<div className="flex items-center gap-2">Billing</div>}
      />
      <div className="flex flex-col gap-4 whitespace-pre-wrap">
        {subscription.data?.data?.items.data.map((item) => (
          <div key={item.id}>
            {item.price.product.name}

            <div>{item.quantity}</div>
          </div>
        ))}
        <Button
          onClick={async () => {
            const result = await upgradeToPro.mutateAsync();
            result.data;
          }}
        >
          Upgrade to Pro
        </Button>
      </div>
    </>
  );
};

export default BillingPlanPage;
