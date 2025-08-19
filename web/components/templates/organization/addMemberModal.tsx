import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InfoBox } from "@/components/ui/helicone/infoBox";
import { Input } from "@/components/ui/input";
import { Muted, Small } from "@/components/ui/typography";
import { useAddOrgMemberMutation } from "@/services/hooks/organizations";
import { Loader2 } from "lucide-react";
import { useState } from "react";

interface AddMemberModalProps {
  orgId: string;
  orgOwnerId: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  onSuccess?: () => void;
}

const AddMemberModal = (props: AddMemberModalProps) => {
  const { orgId, open, setOpen, onSuccess } = props;

  const [errorMessage, setErrorMessage] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(
    null,
  );
  const addMemberMutation = useAddOrgMemberMutation();

  const onSubmitHandler = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");

    const email = e.currentTarget.elements.namedItem(
      "email",
    ) as HTMLInputElement;

    if (!email || !email.value) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    try {
      const result = await addMemberMutation.mutateAsync({
        orgId,
        email: email.value,
      });

      // Check if Better Auth is enabled and we have a temporary password
      const isBetterAuth = process.env.NEXT_PUBLIC_BETTER_AUTH === "true";
      if (isBetterAuth && result?.data?.temporaryPassword) {
        setTemporaryPassword(result.data.temporaryPassword);
        // Reset form but keep modal open to show password
        email.value = "";
      } else {
        onSuccess && onSuccess();
        setOpen(false);
        // Reset form
        email.value = "";
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to add member";
      setErrorMessage(errorMessage);
    }
  };

  const handleClose = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset state when closing
      setErrorMessage("");
      setTemporaryPassword(null);
    }
    setOpen(newOpen);
  };

  const handleDismissPassword = () => {
    setTemporaryPassword(null);
    onSuccess && onSuccess();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {temporaryPassword ? "Member Added Successfully" : "Add New Member"}
          </DialogTitle>
        </DialogHeader>

        {temporaryPassword ? (
          <div className="flex flex-col gap-4">
            <InfoBox variant="success">
              <div className="flex flex-col gap-2">
                <Small>
                  Member has been added successfully. Please share this
                  temporary password with them:
                </Small>
                <div className="mt-2 rounded bg-muted p-3">
                  <code className="font-mono select-all text-sm">
                    {temporaryPassword}
                  </code>
                </div>
                <Small className="mt-2 text-muted-foreground">
                  This password will only be shown once. The user will be
                  prompted to change it on first login.
                </Small>
              </div>
            </InfoBox>
            <div className="flex justify-end">
              <Button onClick={handleDismissPassword}>Done</Button>
            </div>
          </div>
        ) : (
          <form
            action="#"
            method="POST"
            onSubmit={onSubmitHandler}
            className="flex w-full flex-col gap-4"
          >
            <div className="w-full space-y-1.5 text-sm">
              <label
                htmlFor="email"
                className="text-sm font-medium text-foreground"
              >
                User Email
              </label>
              <Input
                type="email"
                name="email"
                id="email"
                placeholder="Enter user email"
              />
            </div>
            <div className="space-y-4">
              {errorMessage && (
                <>
                  <InfoBox variant="error">{errorMessage}</InfoBox>
                  <InfoBox variant="info">
                    <div className="flex flex-col gap-2">
                      <Small>
                        Contact{" "}
                        <span className="font-medium">support@helicone.ai</span>{" "}
                        if this error persists.
                      </Small>
                      <div>
                        <Small className="font-medium">Tips:</Small>
                        <ul className="mt-1 list-disc pl-5">
                          <li>
                            <Muted>
                              Try adding user with all lowercase letters
                            </Muted>
                          </li>
                          <li>
                            <Muted>
                              Only Owners and Admins can add members
                            </Muted>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </InfoBox>
                </>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={addMemberMutation.isPending}>
                {addMemberMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Add Member
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddMemberModal;
