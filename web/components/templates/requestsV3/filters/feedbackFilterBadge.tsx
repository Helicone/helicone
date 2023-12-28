import { Select, SelectItem } from "@tremor/react";
import FilterBadge from "../../../ui/filters/filterBadge";
import {
  HandThumbDownIcon,
  HandThumbUpIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

interface FeedbackFilterBadgeProps {}

const FeedbackFilterBadge = (props: FeedbackFilterBadgeProps) => {
  const {} = props;

  const router = useRouter();
  const query = router.query.feedback;

  const [feedback, setFeedback] = useState<"positive" | "negative">();

  useEffect(() => {
    if (query === undefined) {
      return;
    } else {
      setFeedback(query as "positive" | "negative");
    }
  }, []);

  return (
    <FilterBadge
      title={"Feedback"}
      clearFilter={() => {
        setFeedback(undefined);
        const query = { ...router.query };
        delete query.feedback;
        router.push({
          pathname: router.pathname,
          query,
        });
      }}
      label={feedback}
    >
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between w-full text-sm space-x-2">
          <p className="flex w-[7.5rem]">Feedback is</p>
          <Select
            value={feedback}
            onValueChange={(e) => {
              setFeedback(e as "positive" | "negative");
              router.push({
                pathname: router.pathname,
                query: { ...router.query, feedback: e },
              });
            }}
            enableClear={false}
          >
            <SelectItem value="positive" icon={HandThumbUpIcon}>
              positive
            </SelectItem>
            <SelectItem value="negative" icon={HandThumbDownIcon}>
              negative
            </SelectItem>
          </Select>
        </div>
      </div>
    </FilterBadge>
  );
};

export default FeedbackFilterBadge;
