"use client";

import { useState, useMemo } from "react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  GB_PRICING_TIERS,
  REQUEST_PRICING_TIERS,
  calculateTotalCost,
} from "@helicone-package/pricing";
import Slider from "./Slider";

const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return Math.round(num / 1000).toLocaleString() + "K";
  return num.toLocaleString();
};

const USAGE_PRICING_GB = GB_PRICING_TIERS.map((tier) => ({
  label: tier.label,
  rate: `$${tier.ratePerGB.toFixed(2)}/GB`,
}));

const USAGE_PRICING_REQUESTS = REQUEST_PRICING_TIERS.map((tier) => ({
  label: tier.label,
  rate:
    tier.ratePerLog === 0
      ? "Free"
      : `$${tier.ratePerLog.toFixed(8).replace(/0+$/, "")}`,
}));

export default function UsageEstimator() {
  const [requests, setRequests] = useState(10000);
  const [tokensPerRequest, setTokensPerRequest] = useState(8000);
  const [showExplanation, setShowExplanation] = useState(false);

  const costEstimate = useMemo(() => {
    const estimatedStorageGB = (requests * tokensPerRequest * 4) / 1024 ** 3;
    return {
      storageGB: estimatedStorageGB,
      ...calculateTotalCost(requests, estimatedStorageGB),
    };
  }, [requests, tokensPerRequest]);

  return (
    <div className="w-full flex flex-col lg:flex-row gap-8 lg:gap-16">
      {/* Left - Title */}
      <div className="lg:w-1/3 shrink-0">
        <h2 className="text-2xl font-bold text-slate-900">Pricing calculator</h2>
        <p className="text-slate-500 text-sm mt-1">
          Estimate your monthly costs based on your usage
        </p>
      </div>

      {/* Right - Calculator Card */}
      <div className="flex-1 border border-slate-200 rounded-lg bg-white">
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-slate-600">Usage</span>
          </div>

          {/* Sliders */}
          <div className="flex flex-col sm:flex-row gap-8">
            <div className="flex-1">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-xl font-semibold text-slate-900">
                  {formatNumber(requests)}
                </span>
                <span className="text-sm text-slate-500">Requests per month</span>
              </div>
              <Slider min={10000} max={10000000} exponent={3} onChange={setRequests} />
            </div>

            <div className="flex-1">
              <div className="flex items-baseline gap-2 mb-2">
                <Input
                  type="number"
                  value={tokensPerRequest}
                  onChange={(e) => setTokensPerRequest(Number(e.target.value) || 0)}
                  className="w-24 h-8 text-xl font-semibold"
                />
                <span className="text-sm text-slate-500">Tokens per request</span>
              </div>
            </div>
          </div>
        </div>

        {/* Breakdown */}
        <div className="border-t border-slate-100 px-5 py-3 space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-600">Storage</span>
            <div className="flex items-center gap-3">
              <span className="text-slate-400">
                {costEstimate.storageGB.toFixed(2)} GB
              </span>
              <span className="font-medium text-slate-900 w-16 text-right">
                ${costEstimate.gbCost.cost.toFixed(2)}
              </span>
            </div>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-600">Requests</span>
            <div className="flex items-center gap-3">
              <span className="text-slate-400">
                {formatNumber(requests)} requests
              </span>
              <span className="font-medium text-slate-900 w-16 text-right">
                ${costEstimate.requestsCost.cost.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Total */}
        <div className="border-t border-slate-100 px-5 py-3">
          <div className="flex justify-between">
            <span className="text-slate-700">Estimated monthly total</span>
            <span className="text-xl font-semibold text-slate-900">
              ${costEstimate.totalCost.toFixed(2)}
            </span>
          </div>
        </div>

        {/* How is this calculated */}
        <div className="border-t border-slate-100 px-5 py-3">
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
          >
            <ChevronDownIcon
              className={`w-4 h-4 transition-transform ${
                showExplanation ? "rotate-180" : ""
              }`}
            />
            How is this calculated?
          </button>
          {showExplanation && (
            <div className="mt-4">
              <p className="text-xs text-slate-500 mb-4">
                Storage is estimated at 4 bytes per token. Costs use tiered pricing -
                prices decrease as your volume increases.
              </p>

              <div className="flex flex-col sm:flex-row gap-6">
                {/* Request Pricing */}
                <div className="flex-1">
                  <div className="text-xs font-semibold text-slate-600 mb-2">
                    Request Pricing
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-xs text-slate-500 font-medium px-0 py-1 h-auto">
                          Requests
                        </TableHead>
                        <TableHead className="text-xs text-slate-500 font-medium px-0 py-1 h-auto text-right">
                          Rate
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {USAGE_PRICING_REQUESTS.map((tier, i) => (
                        <TableRow key={i} className="hover:bg-transparent">
                          <TableCell className="px-0 py-1 text-xs text-slate-500">
                            {tier.label}
                          </TableCell>
                          <TableCell className="px-0 py-1 text-xs text-slate-500 text-right">
                            {tier.rate}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Storage Pricing */}
                <div className="flex-1">
                  <div className="text-xs font-semibold text-slate-600 mb-2">
                    Storage Pricing
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-xs text-slate-500 font-medium px-0 py-1 h-auto">
                          Usage
                        </TableHead>
                        <TableHead className="text-xs text-slate-500 font-medium px-0 py-1 h-auto text-right">
                          Rate
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {USAGE_PRICING_GB.map((tier, i) => (
                        <TableRow key={i} className="hover:bg-transparent">
                          <TableCell className="px-0 py-1 text-xs text-slate-500">
                            {tier.label}
                          </TableCell>
                          <TableCell className="px-0 py-1 text-xs text-slate-500 text-right">
                            {tier.rate}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
