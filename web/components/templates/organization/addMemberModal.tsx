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
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { getJawnClient } from "../../../lib/clients/jawn";
import useNotification from "../../shared/notification/useNotification";

interface AddMemberModalProps {
  orgId: string;
  orgOwnerId: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  onSuccess?: () => void;
}

const AddMemberModal = (props: AddMemberModalProps) => {
  const { orgId, orgOwnerId, open, setOpen, onSuccess } = props;

  const [isLoading, setIsLoading] = useState(false);

  const { setNotification } = useNotification();
  const jawn = getJawnClient(orgId);

  const [errorMessage, setErrorMessage] = useState("");
  const onSubmitHandler = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const email = e.currentTarget.elements.namedItem(
      "email"
    ) as HTMLInputElement;

    if (!email || !email.value) {
      setNotification("Failed to add member. Please try again.", "error");
      setErrorMessage("Failed to add member. Please try again.");
      return;
    }

    const { data, error: addMemberError } = await jawn.POST(
      "/v1/organization/{organizationId}/add_member",
      {
        params: {
          path: {
            organizationId: orgId,
          },
        },
        body: {
          email: email.value,
        },
      }
    );
    if (data?.error || addMemberError) {
      const errorMessage = data?.error || addMemberError;
      setNotification(
        errorMessage ? JSON.stringify(errorMessage) : "error adding memeber",
        "error"
      );
      setErrorMessage(
        errorMessage ? JSON.stringify(errorMessage) : "error adding memeber"
      );
      console.error(addMemberError);
    } else {
      setNotification("Member added successfully", "success");
      onSuccess && onSuccess();
      setOpen(false);
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Member</DialogTitle>
        </DialogHeader>

        <form
          action="#"
          method="POST"
          onSubmit={onSubmitHandler}
          className="flex flex-col gap-4 w-full"
        >
          <div className="space-y-1.5 text-sm w-full">
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
                      <ul className="list-disc pl-5 mt-1">
                        <li>
                          <Muted>
                            Try adding user with all lowercase letters
                          </Muted>
                        </li>
                        <li>
                          <Muted>Only Owners and Admins can add members</Muted>
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
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add Member
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddMemberModal;
