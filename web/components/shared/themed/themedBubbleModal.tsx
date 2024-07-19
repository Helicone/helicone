import { XMarkIcon } from "@heroicons/react/24/outline";
import { Row } from "../../layout/common";

interface ThemedBubbleModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  setRemoved: (removed: boolean) => void;
  removed: boolean;
  children: React.ReactNode;
  buttonText?: string;
}

const ThemedBubbleModal = ({
  open,
  setOpen,
  setRemoved,
  removed,
  children,
  buttonText = "Demo 🚀",
}: ThemedBubbleModalProps) => {
  return (
    <>
      {!removed && !open && (
        <Row className="fixed bottom-[16px] right-[16px] z-50 items-center gap-2">
          <div
            className="z-50 w-6 h-6 rounded-full bg-red-500 shadow-lg cursor-pointer flex items-center justify-center text-white text-2xl hover:bg-red-600 transition-colors"
            onClick={() => setRemoved(true)}
          >
            <XMarkIcon className="w-3 h-3" />
          </div>
          <div
            className="px-5 font-extralight h-[48px] rounded-full bg-blue-500 shadow-lg cursor-pointer flex items-center justify-center text-white  hover:bg-blue-600 transition-colors"
            onClick={() => setOpen(true)}
          >
            {buttonText}
          </div>
        </Row>
      )}
      {open && (
        <div className="fixed bottom-4 right-4 z-50 origin-bottom-right">
          {children}
        </div>
      )}
    </>
  );
};

export default ThemedBubbleModal;
