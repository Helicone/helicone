import {
  HandThumbUpIcon,
  HandThumbDownIcon,
} from "@heroicons/react/24/outline";
import {
  HandThumbUpIcon as HTUp,
  HandThumbDownIcon as HTDown,
} from "@heroicons/react/24/solid";
import { clsx } from "../../shared/clsx";
import { useEffect, useState } from "react";
import useNotification from "../../shared/notification/useNotification";
import { updateSessionFeedback } from "../../../services/hooks/sessions";
import { Row } from "../../layout/common/row";

const SessionFeedback = ({
  sessionId,
  defaultValue,
}: {
  sessionId: string;
  defaultValue: boolean | null;
}) => {
  const [feedback, setFeedback] = useState<boolean | null>(defaultValue);
  const { setNotification } = useNotification();

  useEffect(() => {
    setFeedback(defaultValue);
  }, [defaultValue]);

  const updateFeedbackHandler = async (sessionId: string, rating: boolean) => {
    updateSessionFeedback(sessionId, rating)
      .then((res) => {
        if (res && res.status === 200) {
          setFeedback(rating);
          setNotification("Feedback submitted", "success");
        }
      })
      .catch((err) => {
        console.error(err);
        setNotification("Error submitting feedback", "error");
      });
  };

  return (
    <Row className="items-center space-x-3">
      {feedback}
      <button
        onClick={() => {
          if (feedback === true) {
            return;
          }
          updateFeedbackHandler(sessionId, true);
        }}
      >
        {feedback === true ? (
          <HTUp className={clsx("h-5 w-5 text-green-500")} />
        ) : (
          <HandThumbUpIcon className="h-5 w-5 text-green-500" />
        )}
      </button>
      <button
        onClick={() => {
          if (feedback === false) {
            return;
          }
          updateFeedbackHandler(sessionId, false);
        }}
      >
        {feedback === false ? (
          <HTDown className={clsx("h-5 w-5 text-red-500")} />
        ) : (
          <HandThumbDownIcon className="h-5 w-5 text-red-500" />
        )}
      </button>
    </Row>
  );
};

export default SessionFeedback;
