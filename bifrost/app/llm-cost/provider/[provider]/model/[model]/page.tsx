import ModelPriceCalculator from "../../../../ModelPriceCalculator";

export default async function Home({
  params,
}: {
  params: {
    model: string;
    provider: string;
  };
}) {
  const { model: model, provider: provider } = params;
  const decodedModel = decodeURIComponent(model || "");
  const decodedProvider = decodeURIComponent(provider || "");

  return (
    <>
      <div className="container mx-auto py-8">
        <ModelPriceCalculator model={decodedModel} provider={decodedProvider} />
      </div>
    </>
  );
}
