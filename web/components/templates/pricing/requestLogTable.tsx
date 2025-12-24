import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@tremor/react";

interface RequestLogTableProps {}

// Legacy per-request pricing for grandfathered users
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

// Legacy pricing export for grandfathered users
export const HELICONE_LOG_PRICING = BASE_LOG_PRICING.map((pricing) => ({
  ...pricing,
  rate: pricing.rate * MULTIPLIER,
}));

// New byte-based pricing
export const BYTE_PRICING = {
  ratePerGB: 6, // $6 per GB
  freeGB: 1, // First 1 GB free
};

const RequestLogTable = (props: RequestLogTableProps) => {
  const {} = props;

  return (
    <div className="mb-8 mt-2 rounded-lg border border-gray-300 p-2">
      <Table>
        <TableHead>
          <TableRow className="border-b border-gray-300">
            <TableHeaderCell className="text-black">Storage</TableHeaderCell>
            <TableHeaderCell className="text-black">Rate</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell className="text-gray-600">First 1 GB</TableCell>
            <TableCell className="text-black">Free</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="text-gray-600">Additional storage</TableCell>
            <TableCell className="text-black">$6/GB</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
};

export default RequestLogTable;
