import { ThumbsDown, ThumbsUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { updateRequestFeedback } from "../../../services/lib/requests";
import useNotification from "../../shared/notification/useNotification";

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
    <div className="flex flex-row items-center">
      {requestFeedback.rating}
      <Button
        variant="ghost"
        size="square_icon"
        onClick={() => {
          if (requestFeedback.rating === true) {
            return;
          }
          updateFeedbackHandler(requestId, true);
        }}
      >
        {requestFeedback.rating === true ? (
          <ThumbsUp size={16} className={"text-foreground"} />
        ) : requestFeedback.rating === null ? (
          <ThumbsUp size={16} className="text-foreground/40" />
        ) : (
          <ThumbsUp size={16} className="text-foreground/40" />
        )}
      </Button>
      <Button
        variant="ghost"
        size="square_icon"
        onClick={() => {
          if (requestFeedback.rating === false) {
            return;
          }
          updateFeedbackHandler(requestId, false);
        }}
      >
        {requestFeedback.rating === false ? (
          <ThumbsDown size={16} className={"text-foreground"} />
        ) : requestFeedback.rating === null ? (
          <ThumbsDown size={16} className="text-foreground/40" />
        ) : (
          <ThumbsDown size={16} className="text-foreground/40" />
        )}
      </Button>
    </div>
  );
};

export default FeedbackButtons;
