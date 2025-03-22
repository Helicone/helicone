import { LuThumbsDown, LuThumbsUp } from "react-icons/lu";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { updateRequestFeedback } from "../../../services/lib/requests";
import { clsx } from "../../shared/clsx";
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
          <LuThumbsUp className={clsx("h-4 w-4 text-foreground")} />
        ) : (
          <LuThumbsUp className="h-4 w-4 text-foreground fill-muted-foreground/40" />
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
          <LuThumbsDown className={clsx("h-4 w-4 text-foreground")} />
        ) : (
          <LuThumbsDown className="h-4 w-4 text-foreground fill-muted-foreground/40" />
        )}
      </Button>
    </div>
  );
};

export default FeedbackButtons;
