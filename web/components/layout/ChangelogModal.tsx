import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChangelogItem } from "./auth/Sidebar";

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
        <DialogContent className="w-[95vw] sm:w-full max-w-xl max-h-[80vh] overflow-y-auto">
          <DialogHeader className="mt-2">
            <DialogTitle className="flex justify-between items-end text-[20px]">
              {changelog.title}
              <small className="text-xs text-slate-500">
                {new Date(changelog.pubDate).toLocaleDateString()}
              </small>
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            {changelog.image && (
              <div className="w-full h-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={changelog.image.url} alt={changelog.title} />
              </div>
            )}
            <div
              className="prose dark:prose-invert prose-sm prose-h2:text-base prose-h3:text-base"
              dangerouslySetInnerHTML={{ __html: changelog["content:encoded"] }}
            />
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
};

export default ChangelogModal;
