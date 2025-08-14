import { ThumbsDown, ThumbsUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { updateSessionFeedback } from "../../../services/hooks/sessions";
import { updateRequestFeedback } from "../../../services/lib/requests";
import useNotification from "../../shared/notification/useNotification";

interface FeedbackActionProps {
  id: string;
  type: "request" | "session";
  defaultValue: boolean | null;
  onSubmitted?: () => void;
}

const FeedbackAction = ({ id, type, defaultValue, onSubmitted }: FeedbackActionProps) => {
  const [feedbackState, setFeedbackState] = useState<{
    rating: boolean | null;
  }>({ rating: defaultValue });

  const { setNotification } = useNotification();

  useEffect(() => {
    setFeedbackState({ rating: defaultValue });
  }, [defaultValue]);

  const updateFeedbackHandler = async (rating: boolean) => {
    const apiCall =
      type === "request" ? updateRequestFeedback : updateSessionFeedback;

    apiCall(id, rating)
      .then((res) => {
        if (res && res.status === 200) {
          setFeedbackState({
            rating: rating,
          });
          setNotification("Feedback submitted", "success");
          onSubmitted?.();
        }
      })
      .catch((err) => {
        console.error(`Error submitting ${type} feedback:`, err);
        setNotification(`Error submitting ${type} feedback`, "error");
      });
  };

  return (
    <div className="flex flex-row items-center">
      <Button
        variant="ghost"
        size="square_icon"
        onClick={() => {
          if (feedbackState.rating === true) {
            return;
          }
          updateFeedbackHandler(true);
        }}
      >
        {feedbackState.rating === true ? (
          <ThumbsUp size={16} className={"text-green-500"} />
        ) : (
          <ThumbsUp size={16} className="text-foreground/40" />
        )}
      </Button>
      <Button
        variant="ghost"
        size="square_icon"
        onClick={() => {
          if (feedbackState.rating === false) {
            return;
          }
          updateFeedbackHandler(false);
        }}
      >
        {feedbackState.rating === false ? (
          <ThumbsDown size={16} className={"text-red-500"} />
        ) : (
          <ThumbsDown size={16} className="text-foreground/40" />
        )}
      </Button>
    </div>
  );
};

export default FeedbackAction;
