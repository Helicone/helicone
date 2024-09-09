import { useUser } from "@supabase/auth-helpers-react";
import { PostgrestError } from "@supabase/supabase-js";
import { Select, SelectItem, TextInput } from "@tremor/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { getJawnClient } from "../../../../lib/clients/jawn";
import { useOrg } from "../../../layout/organizationContext";
import useNotification from "../../../shared/notification/useNotification";
import HcButton from "../../../ui/hcButton";

export const COMPANY_SIZES = ["Just me", "2-5", "5-25", "25-100", "100+"];

interface CreateOrgProps {
  nextStep: () => void;
  setUserId: (userId: string) => void;
}

const CreateOrg = (props: CreateOrgProps) => {
  const { nextStep, setUserId } = props;

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
  const [userId, setUserIdState] = useState<string>("");
  const { setNotification } = useNotification();
  const { t } = useTranslation();

  const referralOptions = [
    { value: "friend_referral", label: t("Friend (referral)") },
    { value: "google", label: t("Google") },
    { value: "twitter", label: t("Twitter") },
    { value: "linkedin", label: t("LinkedIn") },
    { value: "microsoft_startups", label: t("Microsoft for Startups") },
    { value: "product_hunt", label: t("Product Hunt") },
    { value: "other", label: t("Other") },
  ];

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

    if (userId.trim() === "") {
      setNotification("Please enter a User ID.", "info");
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

    props.setUserId(userId);
    nextStep();
  };

  return (
    <>
      <div id="content" className="w-full flex flex-col space-y-4">
        <div className="flex flex-col p-4">
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
                <TextInput
                  name="org-name"
                  id="org-name"
                  required
                  placeholder={orgContext?.currentOrg?.name}
                  value={orgName}
                  onValueChange={(value) => setOrgName(value)}
                />
              </div>
            </div>
            <div className="flex flex-col space-y-2">
              <label
                htmlFor="org-size"
                className="block text-sm font-semibold leading-6"
              >
                How large is your company?
              </label>
              <div>
                <Select
                  id="org-size"
                  name="org-size"
                  required
                  placeholder="Select company size"
                  value={orgSize}
                  onValueChange={(value) => setOrgSize(value)}
                >
                  {COMPANY_SIZES.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </Select>
              </div>
            </div>
            <div className="flex flex-col space-y-2">
              <label
                htmlFor="user-id"
                className="block text-sm font-semibold leading-6"
              >
                User ID
              </label>
              <div>
                <TextInput
                  id="user-id"
                  name="user-id"
                  required
                  placeholder="Enter your User ID"
                  value={userId}
                  onValueChange={(value) => setUserIdState(value)}
                />
              </div>
            </div>
            <div className="flex flex-col space-y-2">
              <label
                htmlFor="org-referral"
                className="block text-sm font-semibold leading-6"
              >
                How did you hear about us?
              </label>
              <div className="">
                <Select
                  id="org-referral"
                  name="org-referral"
                  required
                  placeholder={t("Select referral source")}
                  value={referralType}
                  onValueChange={(value) => setReferralType(value)}
                >
                  {referralOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </Select>
              </div>
            </div>
            {referralType === "friend_referral" && (
              <div className="flex flex-col space-y-2">
                <label
                  htmlFor="referral-code"
                  className="block text-md font-semibold leading-6"
                >
                  Referral Code (optional)
                </label>
                <div className="">
                  <TextInput
                    id="referral-code"
                    name="referral-code"
                    placeholder={"Referral code"}
                    value={referralCode}
                    onValueChange={(value) => setReferralCode(value)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between p-4">
          <HcButton variant={"secondary"} size={"sm"} title={"Back"} />
          <HcButton
            variant={"primary"}
            size={"sm"}
            title={"Next"}
            onClick={handleOrgCreate}
          />
        </div>
      </div>
    </>
  );
};

export default CreateOrg;
