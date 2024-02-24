import useNotification from "../../shared/notification/useNotification";
import ThemedModal from "../../shared/themed/themedModal";

import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { useState } from "react";
import { Database } from "../../../supabase/database.types";
import { useOrg } from "../../layout/organizationContext";

interface SuggestionModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SuggestionModal = (props: SuggestionModalProps) => {
  const { open, setOpen } = props;
  const user = useUser();
  const org = useOrg();
  const [metricTitle, setMetricTitle] = useState("");
  const [metricType, setMetricType] = useState("");
  const [email, setEmail] = useState("");
  const [useCase, setUseCase] = useState("");
  const [whatElse, setWhatElse] = useState("");
  const client = useSupabaseClient<Database>();

  const { setNotification } = useNotification();
  return (
    <ThemedModal open={open} setOpen={setOpen}>
      <div className="w-[35em]">
        <div className="border border-gray-300 bg-gray-50 rounded-xl p-8 h-full space-y-4 w-full mt-16 lg:mt-0">
          <div>
            <label
              htmlFor="metric-name"
              className="block text-sm lg:text-md font-medium leading-6 text-gray-900"
            >
              Metric Title
            </label>
            <div className="mt-1">
              <input
                onChange={(e) => setMetricTitle(e.target.value)}
                id="metric-title"
                name="metric-title"
                type="text"
                placeholder="e.g. Average Tokens per Request"
                required
                className="block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-600 text-sm lg:text-md lg:leading-6"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="metric-type"
              className="block text-sm lg:text-md font-medium leading-6 text-gray-900"
            >
              Type
            </label>
            <div className="mt-1">
              <input
                onChange={(e) => setMetricType(e.target.value)}
                id="metric-type"
                name="metric-type"
                type="text"
                placeholder="Time Graph | Number | Other"
                required
                className="block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-600 text-sm lg:text-md lg:leading-6"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="email"
              className="block text-sm lg:text-md font-medium leading-6 text-gray-900"
            >
              Email address
            </label>
            <div className="mt-1">
              <input
                onChange={(e) => setEmail(e.target.value)}
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                defaultValue={user?.email}
                required
                className="block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-600 text-sm lg:text-md lg:leading-6"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="use-case"
              className="block text-sm lg:text-md font-medium leading-6 text-gray-900"
            >
              Use Case
            </label>
            <div className="mt-1">
              <input
                onChange={(e) => setUseCase(e.target.value)}
                id="use-case"
                name="use-case"
                type="text"
                required
                placeholder="e.g. Monitor how close we are to OpenAI API limits."
                className="block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-600 text-sm lg:text-md lg:leading-6"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="what-else"
              className="block text-sm lg:text-md font-medium leading-6 text-gray-900"
            >
              What else should we know?
            </label>
            <div className="mt-1">
              <textarea
                onChange={(e) => setWhatElse(e.target.value)}
                id="what-else"
                name="what-else"
                required
                rows={4}
                placeholder={"Hello"}
                className="block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-600 text-sm lg:text-md lg:leading-6"
              />
            </div>
          </div>
          <div className="border-t border-gray-300 flex items-center justify-end pt-4">
            <button
              onClick={() => {
                client
                  .from("user_feedback")
                  .insert({
                    feedback: `
                    Metric Title: ${metricTitle}
                    Type: ${metricType}
                    Email: ${email}
                    Use Case: ${useCase}
                    What else: ${whatElse}
                  `,
                    organization_id: org?.currentOrg?.id ?? "",
                    tag: "dashboard_metric_suggestion",
                  })
                  .then((res) => {
                    if (res.error) {
                      setNotification(
                        "Failed to submit feedback. Please try again.",
                        "error"
                      );
                      return;
                    } else {
                      setOpen(false);
                      setNotification(
                        "Thank you for your feedback!",
                        "success"
                      );
                    }
                  });
              }}
              className="items-center rounded-md bg-black px-4 py-2 text-sm flex font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </ThemedModal>
  );
};

export default SuggestionModal;
