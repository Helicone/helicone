import { useUser, useSupabaseClient } from "@supabase/auth-helpers-react";
import { PostgrestError } from "@supabase/supabase-js";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { getJawnClient } from "../../../../lib/clients/jawn";
import { useOrg } from "../../../layout/organizationContext";
import useNotification from "../../../shared/notification/useNotification";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useJawnClient } from "@/lib/clients/jawnHook";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const COMPANY_SIZES = ["Just me", "2-5", "5-25", "25-100", "100+"];

interface CreateOrgProps {
  nextStep: () => void;
}

const CreateOrg = (props: CreateOrgProps) => {
  const { nextStep } = props;

  const user = useUser();
  const orgContext = useOrg();

  const [referralType, setReferralType] = useState<string>(
    orgContext?.currentOrg?.referral ?? ""
  );
  const [orgName, setOrgName] = useState<string>(
    orgContext?.currentOrg?.name ?? ""
  );
  const [orgSize, setOrgSize] = useState<string>(
    orgContext?.currentOrg?.size ?? ""
  );
  const [referralCode, setReferralCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { setNotification } = useNotification();
  const { t } = useTranslation();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const supabase = useSupabaseClient();
  const jawn = useJawnClient();

  const referralOptions = [
    { value: "friend_referral", label: t("Friend (referral)") },
    { value: "google", label: t("Google") },
    { value: "twitter", label: t("Twitter") },
    { value: "linkedin", label: t("LinkedIn") },
    { value: "microsoft_startups", label: t("Microsoft for Startups") },
    { value: "product_hunt", label: t("Product Hunt") },
    { value: "other", label: t("Other") },
  ];

  const handleAcceptTerms = async () => {
    await jawn.POST("/v1/organization/user/accept_terms");
    supabase.auth.refreshSession();
  };

  const handleOrgCreate = async () => {
    if (!user) return;

    setIsLoading(true);

    if (orgName === "") {
      setNotification("Please enter a company name.", "info");
      setIsLoading(false);
      return;
    }

    if (orgSize === "") {
      setNotification("Please select a company size.", "info");
      setIsLoading(false);
      return;
    }

    if (referralType === "") {
      setNotification("Please select a referral source.", "info");
      setIsLoading(false);
      return;
    }

    function checkError(error: PostgrestError | null) {
      if (error) {
        setNotification(
          "Failed to update organization. Please try again.",
          "error"
        );
        setIsLoading(false);
        return;
      }
    }

    if (!orgContext?.currentOrg?.id) {
      const jawn = getJawnClient(orgContext?.currentOrg?.id);

      const { data } = await jawn.POST("/v1/organization/create", {
        body: {
          name: orgName,
          size: orgSize,
          referral: referralType,
          owner: user.id,
          is_personal: true,
          tier: "free",
        },
      });
      if (!data?.error) {
        console.log("Created personal org! - refetching", orgContext);
        orgContext?.refreshCurrentOrg();
      } else {
        setNotification(
          "Failed to update organization. Please try again.",
          "error"
        );
        setIsLoading(false);
        return;
      }
    }

    if (referralCode && referralCode.trim() !== "") {
      fetch("/api/referral/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          referralCode: referralCode,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            setNotification(
              "Referral code not valid. Please try again.",
              "error"
            );
            setIsLoading(false);
            return;
          } else {
            setIsLoading(false);
            orgContext?.refetchOrgs();
            nextStep();
          }
        });
    } else {
      setNotification("Successfully created organization.", "success");
      setIsLoading(false);
      orgContext?.refetchOrgs();
      nextStep();
    }
  };

  return (
    <>
      <div id="content" className="w-full flex flex-col space-y-4 lg:pt-32 ">
        <div className="flex flex-col p-4 h-full">
          <div className="flex flex-col space-y-8 w-full">
            <h2 className="text-2xl font-semibold">Create your organization</h2>
            <div className="flex flex-col space-y-2">
              <label
                htmlFor="org-name"
                className="block text-sm font-semibold leading-6"
              >
                What is your company name?
              </label>
              <div>
                <Input
                  name="org-name"
                  id="org-name"
                  required
                  placeholder={orgContext?.currentOrg?.name}
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-row space-x-2 w-full">
              <div className="flex flex-col space-y-2 w-full">
                <label
                  htmlFor="org-size"
                  className="block text-sm font-semibold leading-6"
                >
                  How large is your company?
                </label>
                <div>
                  <Select value={orgSize} onValueChange={setOrgSize}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select company size" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMPANY_SIZES.map((o) => (
                        <SelectItem key={o} value={o}>
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-col space-y-2 w-full">
                <label
                  htmlFor="org-referral"
                  className="block text-sm font-semibold leading-6"
                >
                  How did you hear about us?
                </label>
                <div className="">
                  <Select value={referralType} onValueChange={setReferralType}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("Select referral source")} />
                    </SelectTrigger>
                    <SelectContent>
                      {referralOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex flex-col space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={(checked) =>
                    setTermsAccepted(checked as boolean)
                  }
                />
                <Label
                  htmlFor="terms"
                  className="text-sm font-medium leading-none flex items-center gap-2"
                >
                  I accept the
                  <Link
                    href="https://helicone.ai/terms"
                    target="_blank"
                    className="text-primary hover:underline underline"
                  >
                    Terms of Service
                  </Link>
                  and
                  <Link
                    href="https://helicone.ai/privacy"
                    target="_blank"
                    className="text-primary hover:underline underline"
                  >
                    Privacy Policy
                  </Link>
                </Label>
              </div>
            </div>
          </div>
        </div>
        <div className="sticky bottom-0 p-4 flex items-center justify-between">
          <Button variant={"secondary"} size={"sm"}>
            Back
          </Button>
          <Button
            size={"sm"}
            onClick={handleOrgCreate}
            disabled={isLoading || !termsAccepted}
          >
            Accept terms and next
          </Button>
        </div>
      </div>
    </>
  );
};

export default CreateOrg;
