import Cookies from "js-cookie";
import { useOrg } from "../../layout/organizationContext";
import useNotification from "../../shared/notification/useNotification";
import AlertForm, { AlertRequest } from "./alertForm";
import { SUPABASE_AUTH_TOKEN } from "../../../lib/constants";
import ThemedModal from "../../shared/themed/themedModal";
import { Database } from "../../../supabase/database.types";

const API_BASE_PATH = process.env.NEXT_PUBLIC_API_BASE_PATH || "";

// REMOVE THE TRAILING V1 from the API_BASE_PATH
const API_BASE_PATH_WITHOUT_VERSION = API_BASE_PATH.replace("/v1", "");

interface EditAlertModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onSuccess: () => void;
  currentAlert?: Database["public"]["Tables"]["alert"]["Row"];
}

const EditAlertModal = (props: EditAlertModalProps) => {
  const { open, setOpen, onSuccess, currentAlert } = props;

  const { setNotification } = useNotification();
  const orgContext = useOrg();

  const handleEditAlert = async (req: AlertRequest) => {
    const authFromCookie = Cookies.get(SUPABASE_AUTH_TOKEN);
    if (!authFromCookie) {
      setNotification("Please login to create an alert", "error");
      return;
    }
    const decodedCookie = decodeURIComponent(authFromCookie);
    const parsedCookie = JSON.parse(decodedCookie);
    const jwtToken = parsedCookie[0];

    // first create a new alert
    fetch(`${API_BASE_PATH_WITHOUT_VERSION}/alerts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "helicone-jwt": jwtToken,
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
      .then(async (data) => {
        // setNotification("Successfully created alert", "success");
        // setOpen(false);
        // onSuccess();

        // then delete the old alert
        const response = await fetch(
          `${API_BASE_PATH_WITHOUT_VERSION}/alert/${currentAlert?.id}`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              "helicone-jwt": jwtToken,
              "helicone-org-id": orgContext?.currentOrg?.id || "",
            },
          }
        );

        if (!response.ok) {
          setNotification(
            "There was an error editing your alert! Refresh your page to try again..",
            "error"
          );
        }

        onSuccess();
        setOpen(false);
        setNotification("Successfully edited alert", "success");
      })
      .catch((err) => {
        setNotification(`Failed to edit alert ${err}`, "error");
      });
  };

  return (
    <ThemedModal open={open} setOpen={setOpen}>
      <AlertForm
        handleSubmit={(alertReq) => handleEditAlert(alertReq)}
        onCancel={() => setOpen(false)}
        initialValues={currentAlert}
      />
    </ThemedModal>
  );
};

export default EditAlertModal;
