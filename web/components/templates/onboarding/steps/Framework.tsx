import GenerateAPIKey from "../../welcome/steps/generateAPIKey";

const Framework = ({
  selectedIntegrationMethod,
  setCurrentStep,
}: {
  selectedIntegrationMethod: "async" | "proxy";
  setCurrentStep: (step: number) => void;
}) => {
  return (
    <GenerateAPIKey
      selectedIntegrationMethod={selectedIntegrationMethod}
      setCurrentStep={setCurrentStep}
    />
  );
};

export default Framework;
