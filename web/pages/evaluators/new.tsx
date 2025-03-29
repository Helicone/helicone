import { ReactElement } from "react";
import { useRouter } from "next/router";
import AuthLayout from "@/components/layout/auth/authLayout";
import AuthHeader from "@/components/shared/authHeader";
import useNotification from "@/components/shared/notification/useNotification";
import {
  EvaluatorForm,
  EvaluatorFormValues,
} from "@/components/templates/evals/EvaluatorForm";
import { useLLMEvaluatorSubmit } from "@/components/templates/evals/hooks/useEvaluatorSubmit";

const CreateEvaluator = () => {
  const router = useRouter();
  const notification = useNotification();

  // Use the existing hook for creating evaluators that's already used elsewhere
  const createEvaluator = useLLMEvaluatorSubmit((result) => {
    const evaluatorId = result?.data?.data?.id;

    if (evaluatorId) {
      router.push(`/evaluators/${evaluatorId}`);
    } else {
      router.push("/evaluators");
      notification.setNotification(
        "Evaluator created successfully, but couldn't navigate to edit page. Check console for details.",
        "info"
      );
    }
  });

  // Default values for the form
  const defaultValues: Partial<EvaluatorFormValues> = {
    name: "",
    description: "",
    scoringType: "boolean",
    model: "gpt-4o",
    includedVariables: {
      inputs: true,
      promptTemplate: true,
      inputBody: true,
      outputBody: true,
    },
  };

  // Handle form submission
  const handleSubmit = async (data: any): Promise<void> => {
    await createEvaluator.mutateAsync({
      configFormParams: data.configFormParams,
      openAIFunction: data.openAIFunction,
    });
  };

  return (
    <div>
      <AuthHeader
        title="Create Evaluator"
        breadcrumb={{
          title: "Evaluators",
          href: "/evaluators",
        }}
      />
      <div className="p-6 pb-24 bg-background min-h-screen">
        <EvaluatorForm
          initialValues={defaultValues}
          isCreating={true}
          onSubmit={handleSubmit}
          isSubmitting={createEvaluator.isLoading}
          onCancel={() => router.push("/evaluators")}
        />
      </div>
    </div>
  );
};

CreateEvaluator.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default CreateEvaluator;
