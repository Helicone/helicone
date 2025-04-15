import {
  HandThumbUpIcon,
  HandThumbDownIcon,
} from "@heroicons/react/24/outline";
import {
  HandThumbUpIcon as HTUp,
  HandThumbDownIcon as HTDown,
} from "@heroicons/react/24/solid";
import { clsx } from "../../shared/clsx";
import { useState } from "react";
import useNotification from "../../shared/notification/useNotification";
import { updateRequestFeedback } from "../../../services/lib/requests";
import { Row } from "../../layout/common/row";

const FeedbackButtons = ({
  requestId,
  defaultValue,
}: {
  requestId: string;
  defaultValue: boolean | null;
}) => {
  const [requestFeedback, setRequestFeedback] = useState<{
    createdAt: string | null;
    id: string | null;
    rating: boolean | null;
  }>({
    createdAt: null,
    id: null,
    rating: defaultValue,
  });

  const { setNotification } = useNotification();

  const updateFeedbackHandler = async (requestId: string, rating: boolean) => {
    updateRequestFeedback(requestId, rating)
      .then((res) => {
        if (res && res.status === 200) {
          setRequestFeedback({
            ...requestFeedback,
            rating: rating,
          });
          setNotification("Feedback submitted", "success");
        }
      })
      .catch((err) => {
        console.error(err);
        setNotification("Error submitting feedback", "error");
      });
  };

  return (
    <Row className="items-center space-x-4">
      {requestFeedback.rating}
      <button
        onClick={() => {
          if (requestFeedback.rating === true) {
            return;
          }
          updateFeedbackHandler(requestId, true);
        }}
      >
        {requestFeedback.rating === true ? (
          <HTUp className={clsx("h-5 w-5 text-green-500")} />
        ) : (
          <HandThumbUpIcon className="h-5 w-5 text-green-500" />
        )}
      </button>
      <button
        onClick={() => {
          if (requestFeedback.rating === false) {
            return;
          }
          updateFeedbackHandler(requestId, false);
        }}
      >
        {requestFeedback.rating === false ? (
          <HTDown className={clsx("h-5 w-5 text-red-500")} />
        ) : (
          <HandThumbDownIcon className="h-5 w-5 text-red-500" />
        )}
      </button>
    </Row>
  );
};

export default FeedbackButtons;
