import { Database } from "../../../supabase/database.types";

interface JobDetailsProps {
  job: Database["public"]["Tables"]["finetune_job"]["Row"];
}

const JobDetails = (props: JobDetailsProps) => {
  const {} = props;

  return <></>;
};

export default JobDetails;
