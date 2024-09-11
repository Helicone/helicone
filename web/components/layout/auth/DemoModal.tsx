import { useLocalStorage } from "@/services/hooks/localStorage";
import { DemoGame } from "../../shared/themed/demo/demoGame";
import ThemedBubbleModal from "../../shared/themed/themedBubbleModal";

interface DemoModalProps {}

const DemoModal = ({}: DemoModalProps) => {
  const [openDemo, setOpenDemo] = useLocalStorage("openDemo", false);
  const [removedDemo, setRemovedDemo] = useLocalStorage("removedDemo", true);
  return (
    <ThemedBubbleModal
      open={openDemo}
      setOpen={setOpenDemo}
      setRemoved={setRemovedDemo}
      removed={removedDemo}
    >
      <DemoGame setOpenDemo={setOpenDemo} />
    </ThemedBubbleModal>
  );
};

export default DemoModal;
