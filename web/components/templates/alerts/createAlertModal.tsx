import { useJawnClient } from "../../../lib/clients/jawnHook";
import { getHeliconeCookie } from "../../../lib/cookies";
import useNotification from "../../shared/notification/useNotification";
import ThemedModal from "../../shared/themed/themedModal";
import AlertForm, { AlertRequest } from "./alertForm";

import Cookies from "js-cookie";
import { SUPABASE_AUTH_TOKEN } from "../../../lib/constants";
import { Database } from "../../../supabase/database.types";

interface EditAlertModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onSuccess: () => void;
  currentAlert?: Database["public"]["Tables"]["alert"]["Row"];
}

export const EditAlertModal = (props: EditAlertModalProps) => {
  const { open, setOpen, onSuccess, currentAlert } = props;

  const { setNotification } = useNotification();
  const jawn = useJawnClient();

  const handleEditAlert = async (req: AlertRequest) => {
    const authFromCookie = Cookies.get(SUPABASE_AUTH_TOKEN);
    if (!authFromCookie) {
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
      setNotification(`Failed to edit alert ${error}`, "error");
      return;
    }

    const { error: deleteError } = await jawn.DELETE("/v1/alert/{alertId}", {
      params: {
        path: {
          alertId: currentAlert?.id || "",
        },
      },
    });

    if (deleteError) {
      setNotification(
        "There was an error editing your alert! Refresh your page to try again..",
        "error"
      );
      return;
    }

    onSuccess();
    setOpen(false);
    setNotification("Successfully edited alert", "success");
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
interface CreateAlertModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onSuccess: () => void;
}

export const CreateAlertModal = (props: CreateAlertModalProps) => {
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
