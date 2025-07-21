interface RequestLogTableProps {}

const BASE_LOG_PRICING: {
  lower: number;
  upper: number;
  rate: number;
}[] = [
  {
    lower: 0,
    upper: 10_000,
    rate: 0,
  },
  {
    lower: 10_000,
    upper: 2_000_000,
    rate: 0.000248,
  },
  {
    lower: 2_000_000,
    upper: 15_000_000,
    rate: 0.000104,
  },
  {
    lower: 15_000_000,
    upper: 50_000_000,
    rate: 0.0000655,
  },
  {
    lower: 50_000_000,
    upper: 100_000_000,
    rate: 0.0000364,
  },
  {
    lower: 100_000_000,
    upper: Number.MAX_SAFE_INTEGER,
    rate: 0.0000187,
  },
];

const MULTIPLIER = 1.3;

export const HELICONE_LOG_PRICING = BASE_LOG_PRICING.map((pricing) => ({
  ...pricing,
  rate: pricing.rate * MULTIPLIER,
}));

const RequestLogTable = (props: RequestLogTableProps) => {
  const {} = props;

  return (
    <div className="mb-8 mt-2 w-full rounded-lg border border-gray-300 bg-white p-2">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-300">
            <th className="p-2 text-left text-black">Lower Band</th>
            <th className="p-2 text-left text-black">Upper Band</th>
            <th className="p-2 text-left text-black">Rate per log</th>
          </tr>
        </thead>
        <tbody>
          {HELICONE_LOG_PRICING.map((pricing, index) => (
            <tr key={index}>
              <td className="p-2 text-left text-gray-600">
                {new Intl.NumberFormat("us").format(pricing.lower).toString()}
              </td>
              <td className="p-2 text-left text-gray-600">
                {pricing.upper === Number.MAX_SAFE_INTEGER
                  ? "∞"
                  : new Intl.NumberFormat("us")
                      .format(pricing.upper)
                      .toString()}
              </td>
              <td className="text-left text-black">
                {pricing.lower === 0 ? "Free" : `$${pricing.rate.toFixed(7)}`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RequestLogTable;
