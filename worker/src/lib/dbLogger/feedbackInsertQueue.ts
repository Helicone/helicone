import { FeedbackQueue } from "../..";
import { Database } from "../../../supabase/database.types";
import { Result } from "../../results";

export type FeedbackQueueBody = {
  feedback: Database["public"]["Tables"]["feedback"]["Row"];
};

export class FeedbackInsertQueue {
  private feedbackInsertQueue: FeedbackQueue;

  constructor(feedbackInsertQueue: FeedbackQueue) {
    this.feedbackInsertQueue = feedbackInsertQueue;
  }

  async addFeedback(
    feedbackData: Database["public"]["Tables"]["feedback"]["Row"]
  ): Promise<Result<null, string>> {
    try {
      await this.feedbackInsertQueue.send({ feedback: feedbackData });
    } catch (error: any) {
      console.log(`Error sending feedback to queue: ${error.message}`);
      return { data: null, error: error.message };
    }

    return { data: null, error: null };
  }
}
