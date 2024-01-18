import { getHeliconeCookie } from "../../../lib/cookies";
import { useOrg } from "../../layout/organizationContext";
import useNotification from "../../shared/notification/useNotification";
import ThemedModal from "../../shared/themed/themedModal";
import AlertForm, { AlertRequest } from "./alertForm";

interface CreateAlertModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onSuccess: () => void;
}

const API_BASE_PATH = process.env.NEXT_PUBLIC_API_BASE_PATH || "";

// REMOVE THE TRAILING V1 from the API_BASE_PATH
const API_BASE_PATH_WITHOUT_VERSION = API_BASE_PATH.replace("/v1", "");

const CreateAlertModal = (props: CreateAlertModalProps) => {
  const { open, setOpen, onSuccess } = props;

  const { setNotification } = useNotification();

  const orgContext = useOrg();

  const handleCreateAlert = async (req: AlertRequest) => {
    const authFromCookie = getHeliconeCookie();
    if (authFromCookie.error || !authFromCookie.data) {
      setNotification("Please login to create an alert", "error");
      return;
    }

    fetch(`${API_BASE_PATH_WITHOUT_VERSION}/alerts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "helicone-jwt": authFromCookie.data.jwtToken,
        "helicone-org-id": orgContext?.currentOrg?.id || "",
      },
      body: JSON.stringify({
        name: req.name,
        metric: req.metric,
        threshold: req.threshold,
        time_window: req.time_window,
        emails: req.emails,
        org_id: orgContext?.currentOrg?.id,
        minimum_request_count: req.minimum_request_count,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        setNotification("Successfully created alert", "success");
        setOpen(false);
        onSuccess();
      })
      .catch((err) => {
        setNotification(`Failed to create alert ${err}`, "error");
      });
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
