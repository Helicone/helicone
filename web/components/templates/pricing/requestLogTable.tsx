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

// New tiered GB storage pricing (2025-12-10)
export const GB_PRICING_TIERS = [
  { maxGB: 30, ratePerGB: 3.25, label: "First 30 GB" },
  { maxGB: 80, ratePerGB: 2.0, label: "31-80 GB" },
  { maxGB: 200, ratePerGB: 1.25, label: "81-200 GB" },
  { maxGB: 450, ratePerGB: 0.75, label: "201-450 GB" },
  { maxGB: Infinity, ratePerGB: 0.5, label: "450+ GB" },
];

// New tiered request pricing (2025-12-10)
export const REQUEST_PRICING_TIERS = [
  { maxLogs: 10_000, ratePerLog: 0, label: "First 10,000" },
  { maxLogs: 30_000, ratePerLog: 0.0007, label: "10,001-30,000" },
  { maxLogs: 90_000, ratePerLog: 0.00035, label: "30,001-90,000" },
  { maxLogs: 250_000, ratePerLog: 0.000175, label: "90,001-250,000" },
  { maxLogs: 800_000, ratePerLog: 0.0000875, label: "250,001-800,000" },
  { maxLogs: 2_500_000, ratePerLog: 0.00004375, label: "800,001-2,500,000" },
  { maxLogs: Infinity, ratePerLog: 0.00002, label: "2,500,000+" },
];

// Legacy byte-based pricing (kept for backward compatibility)
export const BYTE_PRICING = {
  ratePerGB: GB_PRICING_TIERS[0].ratePerGB, // First tier rate
  freeGB: 0, // No free GB in new model (free requests instead)
};

const RequestLogTable = (props: RequestLogTableProps) => {
  const {} = props;

  return (
    <div className="mb-8 mt-2 space-y-6">
      {/* Storage Pricing Table */}
      <div className="rounded-lg border border-gray-300 p-2">
        <h3 className="mb-2 text-sm font-medium text-black">Storage Pricing</h3>
        <Table>
          <TableHead>
            <TableRow className="border-b border-gray-300">
              <TableHeaderCell className="text-black">Usage</TableHeaderCell>
              <TableHeaderCell className="text-black">Rate</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {GB_PRICING_TIERS.map((tier, i) => (
              <TableRow key={i}>
                <TableCell className="text-gray-600">{tier.label}</TableCell>
                <TableCell className="text-black">
                  ${tier.ratePerGB.toFixed(2)}/GB
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Request Pricing Table */}
      <div className="rounded-lg border border-gray-300 p-2">
        <h3 className="mb-2 text-sm font-medium text-black">Request Pricing</h3>
        <Table>
          <TableHead>
            <TableRow className="border-b border-gray-300">
              <TableHeaderCell className="text-black">Requests</TableHeaderCell>
              <TableHeaderCell className="text-black">Rate</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {REQUEST_PRICING_TIERS.map((tier, i) => (
              <TableRow key={i}>
                <TableCell className="text-gray-600">{tier.label}</TableCell>
                <TableCell className="text-black">
                  {tier.ratePerLog === 0
                    ? "Free"
                    : `$${tier.ratePerLog.toFixed(8).replace(/0+$/, "")}`}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default RequestLogTable;
