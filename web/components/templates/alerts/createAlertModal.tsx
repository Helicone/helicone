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

    const { data, error } = await jawn.POST("/v1/alert/create", {
      body: {
        name: req.name,
        metric: req.metric,
        threshold: req.threshold,
        time_window: req.time_window,
        emails: req.emails,
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

    // fetch(`${API_BASE_PATH_WITHOUT_VERSION}/alerts`, {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //     "helicone-jwt": authFromCookie.data.jwtToken,
    //     "helicone-org-id": orgContext?.currentOrg?.id || "",
    //   },
    //   body: JSON.stringify({
    //     name: req.name,
    //     metric: req.metric,
    //     threshold: req.threshold,
    //     time_window: req.time_window,
    //     emails: req.emails,
    //     org_id: orgContext?.currentOrg?.id,
    //     minimum_request_count: req.minimum_request_count,
    //   }),
    // })
    //   .then((res) => res.json())
    //   .then((data) => {
    //     setNotification("Successfully created alert", "success");
    //     setOpen(false);
    //     onSuccess();
    //   })
    //   .catch((err) => {
    //     setNotification(`Failed to create alert ${err}`, "error");
    //   });
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
