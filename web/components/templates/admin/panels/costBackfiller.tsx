import { useState } from "react";
import { useBackfillCosts } from "../../../../services/hooks/admin";
import { Button } from "@/components/ui/button";

const CostBackfiller = () => {
  const [specifyModel, setSpecifyModel] = useState(false);
  const [timeInterval, setTimeInterval] = useState("now() - INTERVAL 7 DAY");
  const [modelId, setModelId] = useState("");
  const [totalChunks, setTotalChunks] = useState(1);
  const [progress, setProgress] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [success, setSuccess] = useState(false);
  const [shouldCancel, setShouldCancel] = useState(false);
  const { backfillCosts } = useBackfillCosts(() => {});

  const handleBackfill = async () => {
    setIsRunning(true);
    setSuccess(false);
    setProgress(0);
    setShouldCancel(false);

    for (let chunk = 0; chunk < totalChunks; chunk++) {
      if (shouldCancel) {
        break;
      }
      await new Promise((resolve) => {
        backfillCosts(
          {
            timeExpression: timeInterval,
            specifyModel,
            modelId,
            totalChunks,
            chunkNumber: chunk,
          },
          {
            onSuccess: () => {
              setProgress(((chunk + 1) / totalChunks) * 100);
              resolve(null);
            },
            onError: () => {
              setIsRunning(false);
              resolve(null);
            },
          }
        );
      });
    }
    setIsRunning(false);
    if (!shouldCancel) {
      setSuccess(true);
    }
  };

  const handleCancel = () => {
    setShouldCancel(true);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-md border border-destructive bg-white/50 p-4">
        <p className="text-sm text-destructive">
          Cost backfilling is expensive, double check before you run anything.
          If possible, double check adminController.ts and the /backfill-costs
          query for all the columns.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-semibold">Time Range:</span>
        <select
          value={timeInterval}
          onChange={(e) => setTimeInterval(e.target.value)}
          className="w-48 rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <option value="now() - INTERVAL 7 DAY">1 Week</option>
          <option value="now() - INTERVAL 14 DAY">2 Weeks</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-semibold">Total Chunks:</span>
        <input
          type="number"
          min="1"
          value={totalChunks}
          onChange={(e) => setTotalChunks(Math.max(1, parseInt(e.target.value)))}
          className="w-24 rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="specifyModel"
          checked={specifyModel}
          onChange={(e) => setSpecifyModel(e.target.checked)}
          className="h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-ring"
        />
        <label htmlFor="specifyModel" className="font-semibold">
          Specify Model ID
        </label>
      </div>
      {specifyModel && (
        <div className="flex items-center gap-2">
          <span className="font-semibold">Model ID:</span>
          <input
            type="text"
            value={modelId}
            onChange={(e) => setModelId(e.target.value)}
            placeholder="Model ID"
            className="w-48 rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          />
        </div>
      )}
      <div className="flex gap-2">
        <Button
          onClick={handleBackfill}
          disabled={isRunning || (specifyModel && !modelId)}
          variant="action"
        >
          {isRunning ? `Backfilling... (${Math.round(progress)}%)` : "Backfill Costs"}
        </Button>
        {isRunning && (
          <Button
            onClick={handleCancel}
            variant="destructive"
          >
            Cancel
          </Button>
        )}
      </div>
      {isRunning && (
        <div className="w-full bg-muted rounded h-3 overflow-hidden">
          <div
            className="bg-primary h-3 transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}
      {success && (
        <div className="rounded p-2 text-center">
          Backfill completed successfully!
        </div>
      )}
    </div>
  );
};

export default CostBackfiller;
