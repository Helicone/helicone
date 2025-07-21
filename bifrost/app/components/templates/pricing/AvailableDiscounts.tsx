import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Col } from "@/components/common/col";

export default function AvailableDiscounts() {
  return (
    <div className="grid grid-cols-1 rounded-md bg-white py-10 sm:p-8 lg:grid-cols-12">
      <Col className="col-span-5 gap-4 py-[24px]">
        <span className="text-[36px] font-bold text-slate-900">
          Available discounts
        </span>
        <Button asChild variant="outline" className="w-fit">
          <Link href="/contact">Apply here</Link>
        </Button>
      </Col>
      <div className="col-span-7 py-[24px]">
        <div className="grid grid-cols-1 divide-x divide-y divide-slate-200 rounded-lg border-slate-200 sm:grid-cols-2">
          <div className="border-border flex flex-col rounded-t-lg border-l border-r border-t p-[24px] sm:rounded-tr-none sm:border-r-0">
            <h3 className="w-fit rounded-[3px] bg-[#F1F5F9] px-[16px] py-[8px] text-sm font-medium text-slate-900">
              Startups
            </h3>
            <p className="mt-[32px] text-3xl font-bold text-slate-900">
              50%
              <span className="text-sm font-normal text-slate-500">
                {" "}
                off first year
              </span>
            </p>
            <p className="mt-2 text-sm text-slate-500">
              For startups under 2 years old and $5M in funding.
            </p>
          </div>
          <div className="border-border flex flex-col !border-r p-4 sm:rounded-tr-lg">
            <h3 className="w-fit rounded-[3px] bg-[#F1F5F9] px-[16px] py-[8px] text-sm font-medium text-slate-900">
              Non-profits
            </h3>
            <p className="mt-[32px] text-3xl font-bold text-slate-900">
              Discounts
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Depending on your org size.
            </p>
          </div>
          <div className="flex flex-col !border-b-0 !border-r border-slate-200 p-4 sm:rounded-bl-lg sm:!border-b sm:!border-r-0">
            <h3 className="w-fit rounded-[3px] bg-[#F1F5F9] px-[16px] py-[8px] text-sm font-medium text-slate-900">
              Open-source companies
            </h3>
            <p className="mt-[32px] text-3xl font-bold text-slate-900">
              $100
              <span className="text-sm font-normal text-slate-500">
                {" "}
                credit
              </span>
            </p>
            <p className="mt-2 text-sm text-gray-500">For the first year.</p>
          </div>
          <div className="flex flex-col rounded-b-lg !border-b !border-r border-slate-200 p-4 sm:rounded-bl-none">
            <h3 className="w-fit rounded-[3px] bg-[#F1F5F9] px-[16px] py-[8px] text-sm font-medium text-slate-900">
              Students
            </h3>
            <p className="mt-[32px] text-3xl font-bold text-slate-900">Free</p>
            <p className="mt-2 text-sm text-slate-500">
              For most students and educators.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
