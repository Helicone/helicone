import { $JAWN_API } from "@/lib/clients/jawn";
import { useHeliconeAuthClient } from "@/packages/common/auth/client/AuthClientFactory";
import { useEffect, useState } from "react";
import useNotification from "../../shared/notification/useNotification";
import ThemedModal from "../../shared/themed/themedModal";

interface SuggestionModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SuggestionModal = (props: SuggestionModalProps) => {
  const { open, setOpen } = props;
  const [metricTitle, setMetricTitle] = useState("");
  const [metricType, setMetricType] = useState("");
  const [email, setEmail] = useState("");
  const [useCase, setUseCase] = useState("");
  const [whatElse, setWhatElse] = useState("");
  const heliconeAuthClient = useHeliconeAuthClient();
  useEffect(() => {
    setEmail(heliconeAuthClient?.user?.email ?? "");
  }, [heliconeAuthClient?.user?.email]);

  const { setNotification } = useNotification();
  return (
    <ThemedModal open={open} setOpen={setOpen}>
      <div className="w-[35em]">
        <div className="mt-16 h-full w-full space-y-4 rounded-xl border border-gray-300 bg-gray-50 p-8 lg:mt-0">
          <div>
            <label
              htmlFor="metric-name"
              className="lg:text-md block text-sm font-medium leading-6 text-gray-900"
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
                className="lg:text-md block w-full rounded-md border-0 py-1.5 text-sm shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-600 lg:leading-6"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="metric-type"
              className="lg:text-md block text-sm font-medium leading-6 text-gray-900"
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
                className="lg:text-md block w-full rounded-md border-0 py-1.5 text-sm shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-600 lg:leading-6"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="email"
              className="lg:text-md block text-sm font-medium leading-6 text-gray-900"
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
                defaultValue={heliconeAuthClient?.user?.email}
                required
                className="lg:text-md block w-full rounded-md border-0 py-1.5 text-sm shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-600 lg:leading-6"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="use-case"
              className="lg:text-md block text-sm font-medium leading-6 text-gray-900"
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
                className="lg:text-md block w-full rounded-md border-0 py-1.5 text-sm shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-600 lg:leading-6"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="what-else"
              className="lg:text-md block text-sm font-medium leading-6 text-gray-900"
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
                className="lg:text-md block w-full rounded-md border-0 py-1.5 text-sm shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-600 lg:leading-6"
              />
            </div>
          </div>
          <div className="flex items-center justify-end border-t border-gray-300 pt-4">
            <button
              onClick={() => {
                $JAWN_API
                  .POST("/v1/user-feedback", {
                    body: {
                      feedback: `
                    Metric Title: ${metricTitle}
                    Type: ${metricType}
                    Email: ${email}
                    Use Case: ${useCase}
                    What else: ${whatElse}
                  `,
                      tag: "dashboard_metric_suggestion",
                    },
                  })
                  .then((res) => {
                    if (res.error) {
                      setNotification(
                        "Failed to submit feedback. Please try again.",
                        "error",
                      );
                      return;
                    } else {
                      setOpen(false);
                      setNotification(
                        "Thank you for your feedback!",
                        "success",
                      );
                    }
                  });
              }}
              className="flex items-center rounded-md bg-black px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
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
