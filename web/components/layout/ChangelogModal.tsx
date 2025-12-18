import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChangelogItem } from "./auth/types";
import DOMPurify from "dompurify";

const ChangelogModal = ({
  open,
  setOpen,
  changelog,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  changelog: ChangelogItem | null;
}) => {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {changelog && (
        <DialogContent className="max-h-[80vh] w-[95vw] max-w-xl overflow-y-auto sm:w-full">
          <DialogHeader className="mt-2">
            <DialogTitle className="flex items-end justify-between text-[20px]">
              {changelog.title}
              <small className="text-xs text-slate-500">
                {new Date(changelog.pubDate).toLocaleDateString()}
              </small>
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            {changelog.image && (
              <div className="h-full w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={changelog.image.url} alt={changelog.title} />
              </div>
            )}
            <div
              className="prose prose-sm dark:prose-invert prose-h2:text-base prose-h3:text-base"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(changelog["content:encoded"]),
              }}
            />
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
};

export default ChangelogModal;
