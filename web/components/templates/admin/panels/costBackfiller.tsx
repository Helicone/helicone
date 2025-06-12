import { clickhousePriceCalc } from "@helicone-package/cost/";

const CostBackfiller = () => {
  return (
    <div className="flex flex-col gap-4">
      <select
        className="w-48 rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        <option value="now() - INTERVIAL 7 DAY">1 Week</option>
        <option value="now() - INTERVAL 14 DAY">2 Weeks</option>
      </select>
      <input
        type="text"
        placeholder="Model ID"
        className="w-48 rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      />
    </div>
  );
};

export default CostBackfiller;