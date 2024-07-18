interface ThemedBubbleModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  setRemoved: (removed: boolean) => void;
  removed: boolean;
  children: React.ReactNode;
}

const ThemedBubbleModal = ({
  open,
  setOpen,
  setRemoved,
  removed,
  children,
}: ThemedBubbleModalProps) => {
  return (
    <>
      {!removed && !open && (
        <>
          <div
            className="fixed bottom-[16px] right-[16px] z-50 px-5 font-extralight h-[48px] rounded-full bg-blue-500 shadow-lg cursor-pointer flex items-center justify-center text-white text-2xl hover:bg-blue-600 transition-colors"
            onClick={() => setOpen(true)}
          >
            Demo 🚀
          </div>
          <div
            className="fixed bottom-[52px] right-[4px] z-50 w-6 h-6 rounded-full bg-red-500 shadow-lg cursor-pointer flex items-center justify-center text-white text-2xl hover:bg-red-600 transition-colors"
            onClick={() => setRemoved(true)}
          >
            x
          </div>
        </>
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
