import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Col } from "@/components/common/col";

export default function AvailableDiscounts() {
  return (
    <div className="py-10 sm:p-8 grid grid-cols-1 lg:grid-cols-12 bg-white rounded-md">
      <Col className="col-span-5 py-[24px]">
        <span className="text-[36px] font-bold text-slate-900">
          Available <br />
          discounts
        </span>
        <Button
          asChild
          variant={"outline"}
          className="w-fit mt-4 text-slate-900 border-slate-200 shadow-none"
        >
          <Link href="/contact">Apply here</Link>
        </Button>
      </Col>
      <div className="py-[24px] col-span-7">
        <div className="grid grid-cols-1 sm:grid-cols-2 border divide-y divide-slate-200 rounded-lg divide-x border-slate-200">
          <div className="rounded-t-lg sm:rounded-tr-none p-[24px] flex flex-col border-t border-l border-r sm:border-r-0 border-slate-200">
            <h3 className="text-sm font-medium bg-[#F1F5F9] w-fit px-[16px] py-[8px] rounded-[3px] text-slate-900">
              Startups
            </h3>
            <p className="text-3xl font-bold mt-[32px] text-slate-900">
              50%
              <span className="text-sm font-normal text-slate-500">
                {" "}
                off first year
              </span>
            </p>
            <p className="text-sm text-slate-500 mt-2">
              For startups under 2 years old and $5M in funding.
            </p>
          </div>
          <div className="p-4 flex flex-col !border-r sm:rounded-tr-lg border-slate-200">
            <h3 className="text-sm font-medium bg-[#F1F5F9] w-fit px-[16px] py-[8px] rounded-[3px] text-slate-900">
              Non-profits
            </h3>
            <p className="text-3xl font-bold mt-[32px] text-slate-900">
              Discounts
            </p>
            <p className="text-sm text-slate-500 mt-2">
              Depending on your org size.
            </p>
          </div>
          <div className="p-4 flex flex-col !border-b-0 !border-r sm:!border-b sm:!border-r-0 sm:rounded-bl-lg border-slate-200">
            <h3 className="text-sm font-medium bg-[#F1F5F9] w-fit px-[16px] py-[8px] rounded-[3px] text-slate-900">
              Open-source companies
            </h3>
            <p className="text-3xl font-bold mt-[32px] text-slate-900">
              $100
              <span className="text-sm font-normal text-slate-500">
                {" "}
                credit
              </span>
            </p>
            <p className="text-sm text-gray-500 mt-2">For the first year.</p>
          </div>
          <div className="p-4 flex flex-col !border-b !border-r rounded-b-lg sm:rounded-bl-none border-slate-200">
            <h3 className="text-sm font-medium bg-[#F1F5F9] w-fit px-[16px] py-[8px] rounded-[3px] text-slate-900">
              Students
            </h3>
            <p className="text-3xl font-bold mt-[32px] text-slate-900">Free</p>
            <p className="text-sm text-slate-500 mt-2">
              For most students and educators.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
