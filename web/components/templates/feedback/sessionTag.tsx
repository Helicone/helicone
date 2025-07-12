import { useOrg } from "@/components/layout/org/organizationContext";
import useNotification from "@/components/shared/notification/useNotification";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TagType } from "@/packages/common/sessions/tags";
import {
  fetchTag,
  updateTag,
  useTagStore,
} from "@/store/features/sessions/tag";
import { useEffect, useState } from "react";
interface SessionTagProps {
  id: string;
  type: TagType;
}

export const SessionTag = ({ id, type }: SessionTagProps) => {
  const currentOrgId = useOrg()?.currentOrg?.id;
  const { getTag, setTag } = useTagStore();
  const [formTag, setFormTag] = useState(getTag(currentOrgId!, id, type) || "");
  const { setNotification } = useNotification();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    fetchTag(currentOrgId!, id, type, setTag).then((res) => {
      if (res?.error) {
        setNotification("Error fetching tag", "error");
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, type]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          {getTag(currentOrgId!, id, type) || "Add Tag"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Tag</DialogTitle>
          <DialogDescription>
            Make changes to your tag here. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!formTag.trim()) {
              setNotification("Tag cannot be empty", "error");
              return;
            }

            updateTag(currentOrgId!, id, formTag, type, setTag).then((res) => {
              if (res?.error) {
                setNotification("Error updating tag", "error");
              } else {
                setOpen(false);
                setNotification("Tag updated", "success");
              }
            });
          }}
        >
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tag" className="text-right">
                Tag
              </Label>
              <Input
                id="tag"
                type="text"
                value={formTag}
                onChange={(e) => {
                  setFormTag(e.target.value);
                }}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Save changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
