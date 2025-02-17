"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ExternalLink,
  Check,
  CornerDownLeft,
  Plus,
  X,
  Mail,
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

type OnboardingStep = "ORGANIZATION" | "PLAN" | "MEMBERS";
type PlanType = "free" | "pro" | "team";
type MemberRole = "owner" | "admin" | "member";

interface Member {
  email: string;
  role: MemberRole;
}

interface OrganizationForm {
  name: string;
  plan: PlanType;
  members: Member[];
}

export default function OnboardingPage() {
  const router = useRouter();
  const org = useOrg();
  const user = useUser();
  const [currentStep, setCurrentStep] =
    useState<OnboardingStep>("ORGANIZATION");
  const [formData, setFormData] = useState<OrganizationForm>({
    name: "",
    plan: "free",
    members: [],
  });

  useEffect(() => {
    const savedStep = localStorage.getItem("onboardingStep");
    const savedForm = localStorage.getItem("onboardingForm");

    if (savedStep) setCurrentStep(savedStep as OnboardingStep);
    if (savedForm) setFormData(JSON.parse(savedForm));
  }, []);

  useEffect(() => {
    localStorage.setItem("onboardingStep", currentStep);
    localStorage.setItem("onboardingForm", JSON.stringify(formData));
  }, [currentStep, formData]);

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
      const response = await jawn.POST("/v1/organization/create", {
        body: {
          name: data.name,
          owner: user?.id!,
          color: "blue",
          icon: "code",
          has_onboarded: false,
          tier: "free",
        },
      });
      return response;
    },
    onSuccess: () => {
      org?.refetchOrgs?.();
      router.push("/dashboard");
    },
  });

  const handlePlanChange = (plan: PlanType) => {
    setFormData((prev) => ({
      ...prev,
      plan,
    }));
    if (plan === "pro") setCurrentStep("MEMBERS");
  };

  const handleAddMember = (email: string, role: MemberRole) => {
    setFormData((prev) => ({
      ...prev,
      members: [...prev.members, { email, role }],
    }));
  };

  const handleRemoveMember = (email: string) => {
    setFormData((prev) => ({
      ...prev,
      members: prev.members.filter((m) => m.email !== email),
    }));
  };

  return (
    <div className="min-h-screen w-full flex justify-center">
      <div className="max-w-xl mx-auto mt-20 px-4">
        <div className="space-y-8">
          <OrganizationStep
            currentStep={currentStep}
            name={formData.name}
            onNameChange={(name) => setFormData((prev) => ({ ...prev, name }))}
            onNextStep={(name) => {
              setFormData((prev) => ({ ...prev, name }));
              setCurrentStep("PLAN");
            }}
          />

          {(currentStep === "PLAN" || currentStep === "MEMBERS") && (
            <PlanStep
              plan={formData.plan}
              onPlanChange={handlePlanChange}
              onComplete={() =>
                setCurrentStep((prev) => (prev === "PLAN" ? "MEMBERS" : prev))
              }
            />
          )}

          {currentStep === "MEMBERS" &&
            (formData.plan === "pro" || formData.plan === "team") && (
              <MembersTable
                members={formData.members}
                onAddMember={handleAddMember}
                onRemoveMember={handleRemoveMember}
              />
            )}

          {currentStep === "PLAN" ||
            (currentStep === "MEMBERS" && (
              <div className="flex justify-end">
                <Button
                  className="bg-sky-600 hover:bg-sky-700 text-white h-11"
                  onClick={() => {
                    if (formData.plan === "pro" || formData.plan === "team") {
                      router.push("/onboarding/billing");
                    } else {
                      createOrganization(formData);
                    }
                  }}
                  disabled={!formData.name || !formData.plan}
                >
                  Continue
                </Button>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

const OrganizationStep = ({
  currentStep,
  name,
  onNameChange,
  onNextStep,
}: {
  currentStep: OnboardingStep;
  name: string;
  onNameChange: (name: string) => void;
  onNextStep: (name: string) => void;
}) => {
  const [localName, setLocalName] = useState(name);

  useEffect(() => {
    setLocalName(name);
  }, [name]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setLocalName(newName);
    onNameChange(newName);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Welcome to Helicone! 👋</h1>
        <div className="text-md font-light text-slate-500">
          Glad to have you here. Create your first organization.
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-md font-medium text-slate-800">
          Organization
        </label>
        <div className="flex gap-8 h-10">
          <Input
            type="text"
            value={localName}
            onChange={handleNameChange}
            className="h-full"
          />
          {currentStep === "ORGANIZATION" ? (
            <Button
              size="icon"
              className="h-full w-10 bg-slate-500 hover:bg-slate-600"
              onClick={() => onNextStep(localName)}
              disabled={!localName}
            >
              <CornerDownLeft className="h-5 w-5 text-white" />
            </Button>
          ) : (
            <Check className="h-full w-5 text-sky-600" />
          )}
        </div>
        {localName && (
          <p className="text-sm font-light text-slate-400">
            Don't worry, you can rename your organization later.
          </p>
        )}
      </div>
    </div>
  );
};

const PLAN_OPTIONS: Record<PlanType, { label: string; hasTrial: boolean }> = {
  free: { label: "Free ($0/mo)", hasTrial: false },
  pro: { label: "Pro ($20/mo/user)", hasTrial: true },
  team: { label: "Team ($200/mo)", hasTrial: true },
};

const PlanStep = ({
  plan,
  onPlanChange,
  onComplete,
}: {
  plan: PlanType;
  onPlanChange: (plan: PlanType) => void;
  onComplete: () => void;
}) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <label className="text-md font-medium text-slate-800">Plan</label>
      <Link
        href="#"
        className="text-sm text-sky-600 hover:text-sky-700 flex items-center gap-1"
      >
        Pricing
        <ExternalLink className="h-4 w-4" />
      </Link>
    </div>
    <Select
      value={plan}
      onValueChange={(v: PlanType) => {
        onPlanChange(v);
        onComplete();
      }}
    >
      <SelectTrigger className="h-10 text-base font-light">
        <SelectValue>
          <div className="flex items-center justify-between w-full">
            <span>{PLAN_OPTIONS[plan].label}</span>
            {PLAN_OPTIONS[plan].hasTrial && (
              <span className="text-xs bg-sky-50 text-sky-600 px-2 py-0.5 rounded">
                7-day trial
              </span>
            )}
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {Object.entries(PLAN_OPTIONS).map(([value, { label, hasTrial }]) => (
          <SelectItem key={value} value={value} className="text-base">
            <div className="flex items-center justify-between w-full font-light">
              <span>{label}</span>
              {hasTrial && (
                <span className="text-xs bg-sky-50 text-sky-600 px-2 py-0.5 rounded">
                  7-day trial
                </span>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

interface MembersTableProps {
  members: Member[];
  onAddMember: (email: string, role: MemberRole) => void;
  onRemoveMember: (email: string) => void;
}

const MembersTable = ({
  members,
  onAddMember,
  onRemoveMember,
}: MembersTableProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newMemberForm, setNewMemberForm] = useState<{
    email: string;
    role: MemberRole;
  }>({
    email: "",
    role: "member",
  });

  const handleInvite = () => {
    if (
      newMemberForm.email &&
      !members.find((m) => m.email === newMemberForm.email)
    ) {
      onAddMember(newMemberForm.email, newMemberForm.role);
      setNewMemberForm({ email: "", role: "member" });
      setIsOpen(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-center">
        <div className="text-slate-900 text-base font-semibold">Members</div>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2 border-slate-200"
          onClick={() => setIsOpen(true)}
        >
          <Plus className="h-4 w-4 text-slate-700" />
          <span className="text-slate-900 text-sm font-medium">Invite</span>
        </Button>
      </div>

      <div className="flex flex-col">
        {/* Header Row */}
        <div className="flex">
          <div className="grow px-4 py-2 bg-slate-100 rounded-tl-md border border-slate-200">
            <span className="text-slate-900 text-sm font-medium">User</span>
          </div>
          <div className="w-[120px] px-4 py-2 bg-slate-100 rounded-tr-md border border-slate-200">
            <span className="text-slate-900 text-sm font-medium">Role</span>
          </div>
        </div>

        {/* Current User Row */}
        <div className="flex">
          <div className="grow px-4 py-2 bg-white border border-slate-200 flex items-center gap-2.5">
            <span className="text-slate-900 text-sm">lina@helicone.ai</span>
            <div className="px-1.5 bg-slate-100 rounded">
              <span className="text-slate-700 text-xs font-medium">YOU</span>
            </div>
          </div>
          <div className="w-[120px] px-4 py-2 bg-white border border-slate-200">
            <span className="text-slate-900 text-sm">Owner</span>
          </div>
        </div>

        {/* Invited Members Rows */}
        {members.map((member) => (
          <div key={member.email} className="flex">
            <div className="grow px-4 py-2 bg-white border border-slate-200 flex items-center justify-between">
              <span className="text-slate-900 text-sm">{member.email}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemoveMember(member.email)}
                className="h-6 px-2 hover:bg-slate-100"
              >
                <X className="h-4 w-4 text-slate-500" />
              </Button>
            </div>
            <div className="w-[120px] px-4 py-2 bg-white border border-slate-200">
              <span className="text-slate-900 text-sm capitalize">
                {member.role}
              </span>
            </div>
          </div>
        ))}

        {/* Last Row Rounded Corners */}
        <div className="flex">
          <div className="grow h-[1px] bg-slate-200 rounded-bl-md" />
          <div className="w-[120px] h-[1px] bg-slate-200 rounded-br-md" />
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="p-6 gap-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-slate-900">
              Invite a member
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              New members will receive an email to join your organization.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <label className="w-20 text-black text-sm font-medium">
                Email
              </label>
              <Input
                type="email"
                value={newMemberForm.email}
                onChange={(e) =>
                  setNewMemberForm((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
                className="flex-1"
                placeholder="Email"
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="w-20 text-black text-sm font-medium">
                Role
              </label>
              <Select
                value={newMemberForm.role}
                onValueChange={(value: MemberRole) =>
                  setNewMemberForm((prev) => ({ ...prev, role: value }))
                }
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-sky-700 hover:bg-sky-800"
              onClick={handleInvite}
              disabled={
                !newMemberForm.email ||
                members.some((m) => m.email === newMemberForm.email)
              }
            >
              <Mail className="h-4 w-4 mr-2" />
              Send invitation
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
