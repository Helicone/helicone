import { useJawnClient } from "../../../lib/clients/jawnHook";
import { getHeliconeCookie } from "../../../lib/cookies";
import useNotification from "../../shared/notification/useNotification";
import ThemedModal from "../../shared/themed/themedModal";
import AlertForm, { AlertRequest } from "./alertForm";

interface CreateAlertModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onSuccess: () => void;
}

const CreateAlertModal = (props: CreateAlertModalProps) => {
  const { open, setOpen, onSuccess } = props;

  const jawn = useJawnClient();
  const { setNotification } = useNotification();

  const handleCreateAlert = async (req: AlertRequest) => {
    const authFromCookie = getHeliconeCookie();
    if (authFromCookie.error || !authFromCookie.data) {
      setNotification("Please login to create an alert", "error");
      return;
    }

    const { error } = await jawn.POST("/v1/alert/create", {
      body: {
        name: req.name,
        metric: req.metric,
        threshold: req.threshold,
        time_window: req.time_window,
        emails: req.emails,
        slack_channels: req.slack_channels,
        minimum_request_count: req.minimum_request_count,
      },
    });

    if (error) {
      setNotification(`Failed to create alert ${error}`, "error");
      return;
    }

    setNotification("Successfully created alert", "success");
    setOpen(false);
    onSuccess();
  };

  return (
    <ThemedModal open={open} setOpen={setOpen}>
      <AlertForm
        handleSubmit={(alertReq) => handleCreateAlert(alertReq)}
        onCancel={() => setOpen(false)}
      />
    </ThemedModal>
  );
};

export default CreateAlertModal;
