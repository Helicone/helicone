import { SupabaseClient } from "@supabase/supabase-js";
import { DateMetrics } from "./timeGraph";

interface TimeGraphWHeaderProps {
  client: SupabaseClient;
}

const TimeGraphWHeader = (props: TimeGraphWHeaderProps) => {
  const { client } = props;

  return (
    <div className="h-full w-full">
      <div className="w-full h-1/6">
        <p className="text-lg text-black">Number of requests over time</p>
      </div>
      <div className="w-full h-72">
        <DateMetrics client={client} />
      </div>
    </div>
  );
};

export default TimeGraphWHeader;
