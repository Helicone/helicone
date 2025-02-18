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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { z } from "zod";

type OnboardingStep = "ORGANIZATION" | "MEMBERS";
type PlanType = "free" | "pro" | "team";
type MemberRole = "admin" | "member";

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
  const [nameError, setNameError] = useState("");

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
    <div className="min-h-screen w-full flex justify-center items-start">
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
            setFormData((prev) => ({ ...prev, name }));
            setNameError(name ? "" : "Please enter an organization name :)");
          }}
        />

        <PlanStep
          plan={formData.plan}
          onPlanChange={handlePlanChange}
          onComplete={() =>
            setCurrentStep((prev) =>
              prev === "ORGANIZATION" ? "MEMBERS" : prev
            )
          }
        />

        {currentStep === "MEMBERS" &&
          (formData.plan === "pro" || formData.plan === "team") && (
            <MembersTable
              members={formData.members}
              onAddMember={handleAddMember}
              onRemoveMember={handleRemoveMember}
              ownerEmail={user?.email ?? ""}
            />
          )}

        {currentStep === "ORGANIZATION" ||
          (currentStep === "MEMBERS" && (
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
          ))}
      </div>
    </div>
  );
}

const OrganizationStep = ({
  name,
  onNameChange,
}: {
  name: string;
  onNameChange: (name: string) => void;
}) => {
  const [localName, setLocalName] = useState(name);
  const [error, setError] = useState("");

  useEffect(() => {
    setLocalName(name);
  }, [name]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setLocalName(newName);
    onNameChange(newName);
    setError(newName ? "" : "Please enter an organization name :)");
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-md font-medium text-slate-800">Organization</h2>
        <div className="flex gap-8 h-10">
          <Input
            type="text"
            value={localName}
            onChange={handleNameChange}
            className={`h-full ${error ? "border-red-500 text-red-500" : ""}`}
          />
        </div>
        {error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : localName ? (
          <p className="text-sm font-light text-slate-400">
            Don't worry, you can rename your organization later.
          </p>
        ) : null}
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
  <div className="flex flex-col gap-2">
    <div className="flex items-center justify-between">
      <h2 className="text-md font-medium text-slate-800">Plan</h2>
      <Link
        href="https://helicone.ai/pricing"
        className="text-sm font-normal text-slate-500 underline hover:text-slate-600"
        target="_blank"
        rel="noopener noreferrer"
      >
        See pricing
      </Link>
    </div>
    <Select
      value={plan}
      onValueChange={(v: PlanType) => {
        onPlanChange(v);
        onComplete();
      }}
    >
      <SelectTrigger className="h-10">
        <SelectValue className="text-md">
          <div className="flex text-sm items-center gap-4">
            <span>{PLAN_OPTIONS[plan].label}</span>
            {PLAN_OPTIONS[plan].hasTrial && (
              <Label variant="badge">7-day trial</Label>
            )}
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {Object.entries(PLAN_OPTIONS).map(([value, { label, hasTrial }]) => (
          <SelectItem key={value} value={value}>
            <div className="flex items-center items-center gap-4">
              <span>{label}</span>
              {hasTrial && <Label variant="badge">7-day trial</Label>}
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
  ownerEmail: string;
}

const MembersTable = ({
  members,
  onAddMember,
  onRemoveMember,
  ownerEmail,
}: MembersTableProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [newMemberForm, setNewMemberForm] = useState<MemberFormData>({
    email: "",
    role: "member",
  });

  const validateForm = (data: MemberFormData) => {
    try {
      memberSchema.parse(data);
      if (data.email === ownerEmail) {
        setEmailError("This email belongs to the organization owner");
        return false;
      }
      if (members.some((m) => m.email === data.email)) {
        setEmailError("This email has already been invited");
        return false;
      }
      setEmailError("");
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const emailError = error.errors.find((e) => e.path[0] === "email");
        if (emailError) {
          setEmailError(emailError.message);
        }
      }
      return false;
    }
  };

  const handleInvite = () => {
    if (validateForm(newMemberForm)) {
      onAddMember(newMemberForm.email, newMemberForm.role);
      setNewMemberForm({ email: "", role: "member" });
      setIsOpen(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-center">
        <h2 className="text-md font-medium text-slate-800">Members</h2>
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

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead className="w-[120px]">Role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="flex items-center gap-2.5">
              <span>{ownerEmail}</span>
              <div className="px-1.5 bg-slate-100 rounded">
                <span className="text-slate-700 text-xs font-medium">YOU</span>
              </div>
            </TableCell>
            <TableCell>Owner</TableCell>
          </TableRow>
          {members.map((member) => (
            <TableRow key={member.email}>
              <TableCell className="flex items-center justify-between">
                <span>{member.email}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveMember(member.email)}
                  className="h-6 px-2 hover:bg-slate-100"
                >
                  <X className="h-4 w-4 text-slate-500" />
                </Button>
              </TableCell>
              <TableCell className="capitalize">{member.role}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="p-6 gap-2 w-62">
          <div className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold text-slate-900">
                Invite a member
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-500">
                New members will receive an email to join your organization.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="w-20 text-black text-sm font-normal">
                  Email
                </label>
                <div className="flex-1 flex flex-col gap-1">
                  <Input
                    type="email"
                    value={newMemberForm.email}
                    onChange={(e) => {
                      const newForm = {
                        ...newMemberForm,
                        email: e.target.value,
                      };
                      setNewMemberForm(newForm);
                      if (emailError) validateForm(newForm);
                    }}
                    className={`flex-1 ${emailError ? "border-red-500" : ""}`}
                    placeholder="Email"
                  />
                  {emailError && (
                    <span className="text-red-500 text-xs">{emailError}</span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="w-20 text-black text-sm font-normal">
                  Role
                </label>
                <Select
                  value={newMemberForm.role}
                  onValueChange={(value: MemberRole) =>
                    setNewMemberForm((prev) => ({ ...prev, role: value }))
                  }
                >
                  <SelectTrigger className="flex-1 h-10 text-sm">
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
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
