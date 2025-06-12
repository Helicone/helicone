import { useState } from "react";
import {
    useBackfillCosts,
  } from "../../../../services/hooks/admin";
import { Button } from "@/components/ui/button";

const CostBackfiller = () => {
  const [specifyModel, setSpecifyModel] = useState(false);
  const [timeInterval, setTimeInterval] = useState("now() - INTERVAL 7 DAY");
  const [modelId, setModelId] = useState("");

  const { backfillCosts, isBackfillingCosts } = useBackfillCosts(() => {
    
    console.log("Backfill completed successfully");
  });

  const handleBackfill = () => {
    backfillCosts({
      timeExpression: timeInterval,
      specifyModel,
      modelId,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-md border border-destructive bg-white/50 p-4">
        <p className="text-sm text-destructive">
          Cost backfilling is expensive, double check before you run anything. If possible, double check adminController.ts and the /backfill-costs query for all the columns.
        </p>
      </div>
      <select
        value={timeInterval}
        onChange={(e) => setTimeInterval(e.target.value)}
        className="w-48 rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        <option value="now() - INTERVAL 7 DAY">1 Week</option>
        <option value="now() - INTERVAL 14 DAY">2 Weeks</option>
      </select>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="specifyModel"
          checked={specifyModel}
          onChange={(e) => setSpecifyModel(e.target.checked)}
          className="h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-ring"
        />
        <label htmlFor="specifyModel" className="text-sm">
          Specify Model ID
        </label>
      </div>
      {specifyModel && (
        <input
          type="text"
          value={modelId}
          onChange={(e) => setModelId(e.target.value)}
          placeholder="Model ID"
          className="w-48 rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        />
      )}
      <Button
        onClick={handleBackfill}
        disabled={isBackfillingCosts || (specifyModel && !modelId)}
        variant="action"
      >
        {isBackfillingCosts ? "Backfilling..." : "Backfill Costs"}
      </Button>
    </div>
  );
};

export default CostBackfiller;