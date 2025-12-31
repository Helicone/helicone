import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@tremor/react";

// Re-export from shared package for backward compatibility
export {
  GB_PRICING_TIERS,
  REQUEST_PRICING_TIERS,
  BYTE_PRICING,
} from "@helicone-package/pricing";

import {
  GB_PRICING_TIERS,
  REQUEST_PRICING_TIERS,
} from "@helicone-package/pricing";

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
