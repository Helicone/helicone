import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@tremor/react";

interface RequestLogTableProps {}

const BASE_LOG_PRICING: {
  lower: number;
  upper: number;
  rate: number;
}[] = [
  {
    lower: 0,
    upper: 100_000,
    rate: 0,
  },
  {
    lower: 100_000,
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
    <div className="border border-gray-300 p-2 rounded-lg mt-2 mb-8">
      <Table>
        <TableHead>
          <TableRow className="border-b border-gray-300">
            <TableHeaderCell className="text-black">Lower Band</TableHeaderCell>
            <TableHeaderCell className="text-black">Upper Band</TableHeaderCell>
            <TableHeaderCell className="text-black">
              Rate per log
            </TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {HELICONE_LOG_PRICING.map((pricing, index) => (
            <TableRow key={index}>
              <TableCell className="text-gray-600">
                {new Intl.NumberFormat("us").format(pricing.lower).toString()}
              </TableCell>
              <TableCell className="text-gray-600">
                {pricing.upper === Number.MAX_SAFE_INTEGER
                  ? "∞"
                  : new Intl.NumberFormat("us")
                      .format(pricing.upper)
                      .toString()}
              </TableCell>
              <TableCell className="text-black">
                {pricing.lower === 0 ? "Free" : `$${pricing.rate.toFixed(7)}`}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default RequestLogTable;
