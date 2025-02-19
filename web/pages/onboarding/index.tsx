"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ExternalLink,
  Check,
  CornerDownLeft,
  Plus,
  X,
  Mail,
  ChevronRightIcon,
  Settings,
  Sun,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOrg } from "@/components/layout/org/organizationContext";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useUser } from "@supabase/auth-helpers-react";
import { getJawnClient } from "@/lib/clients/jawn";
import { Addons } from "@/components/templates/organization/plan/upgradeProDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { z } from "zod";
import {
  MemberRole,
  OnboardingStep,
  PlanType,
  useOrgOnboardingStore,
} from "@/store/onboardingStore";
import useNotification from "@/components/shared/notification/useNotification";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import Image from "next/image";
import { OnboardingHeader } from "@/components/onboarding/Header";
import { OrganizationStep } from "@/components/onboarding/Steps/OrganizationStep";
import { PlanStep } from "@/components/onboarding/Steps/PlanStep";
import { MembersTable } from "@/components/onboarding/MembersTable";

interface Member {
  email: string;
  role: MemberRole;
}

interface OrganizationForm {
  name: string;
  plan: PlanType;
  members: Member[];
}

const memberSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  role: z.enum(["member", "admin"] as const),
});

type MemberFormData = z.infer<typeof memberSchema>;

const BreadcrumbSeparator = () => (
  <svg
    width="9"
    height="15"
    viewBox="0 0 9 15"
    fill="none"
    className="text-slate-200"
  >
    <path d="M1 0V15" stroke="currentColor" />
  </svg>
);

export default function OnboardingPage() {
  const router = useRouter();
  const org = useOrg();
  const user = useUser();
  const { setNotification } = useNotification();
  const { currentStep, formData, setCurrentStep, setFormData } =
    useOrgOnboardingStore();
  const [nameError, setNameError] = useState("");

  const subscription = useQuery({
    queryKey: ["subscription", org?.currentOrg?.id],
    queryFn: async (query) => {
      const orgId = query.queryKey[1] as string;
      const jawn = getJawnClient(orgId);
      const subscription = await jawn.GET("/v1/stripe/subscription");
      return subscription;
    },
    enabled: !!org?.currentOrg?.id,
  });

  const { mutate: createOrganization } = useMutation({
    mutationFn: async (data: OrganizationForm) => {
      const jawn = getJawnClient(org?.currentOrg?.id);
      const { error: createOrgError, data: responseData } = await jawn.POST(
        "/v1/organization/create",
        {
          body: {
            name: data.name,
            owner: user?.id!,
            color: "blue",
            icon: "code",
            has_onboarded: false,
            tier: "free",
          },
        }
      );

      if (createOrgError) {
        setNotification(
          "Failed to create organization: " + createOrgError,
          "error"
        );
        return { error: createOrgError, data: null };
      }

      return { error: null, data: responseData.data };
    },
    onSuccess: (response) => {
      if (response.data) {
        setNotification("Organization created successfully!", "success");
        org?.setCurrentOrg(response.data);
        org?.refetchOrgs?.();
        router.push("/dashboard");
      }
    },
  });

  const handlePlanChange = (plan: PlanType) => {
    setFormData({ plan });
    if (plan === "pro") setCurrentStep("MEMBERS");
  };

  const handleAddMember = (email: string, role: MemberRole) => {
    setFormData({
      members: [...formData.members, { email, role }],
    });
  };

  const handleRemoveMember = (email: string) => {
    setFormData({
      members: formData.members.filter((m) => m.email !== email),
    });
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center">
      <OnboardingHeader />

      <div className="w-full max-w-md mt-20 px-4">
        <div className="flex flex-col gap-4 w-full max-w-md mt-20">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold">Welcome to Helicone! 👋</h1>
            <div className="text-md font-light text-slate-500">
              Glad to have you here. Create your first organization.
            </div>
          </div>

          <OrganizationStep
            name={formData.name}
            onNameChange={(name) => {
              setFormData({ name });
              setNameError(name ? "" : "Please enter an organization name :)");
            }}
          />

          <PlanStep
            plan={formData.plan}
            onPlanChange={handlePlanChange}
            onComplete={() => setCurrentStep("MEMBERS")}
          />

          {currentStep === "MEMBERS" && formData.plan !== "free" && (
            <MembersTable
              members={formData.members}
              onAddMember={handleAddMember}
              onRemoveMember={handleRemoveMember}
              ownerEmail={user?.email ?? ""}
            />
          )}

          <div className="flex justify-end">
            <Button
              variant="action"
              className="w-full"
              onClick={() => {
                if (!formData.name) return;
                if (formData.plan === "pro" || formData.plan === "team") {
                  router.push("/onboarding/billing");
                } else {
                  createOrganization(formData);
                }
              }}
              disabled={!formData.name || !formData.plan}
            >
              Create organization
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
