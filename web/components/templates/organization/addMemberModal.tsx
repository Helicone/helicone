import { Loader2 } from "lucide-react";
import { useState } from "react";
import { getJawnClient } from "../../../lib/clients/jawn";
import useNotification from "../../shared/notification/useNotification";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

  const onSubmitHandler = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const email = e.currentTarget.elements.namedItem(
      "email"
    ) as HTMLInputElement;

    if (!email || !email.value) {
      setNotification("Failed to add member. Please try again.", "error");
      return;
    }

    const { error: addMemberError } = await jawn.POST(
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
    if (addMemberError) {
      setNotification("Error adding member", "error");
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
