import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function BillingPage() {
  return (
    <div className="w-full min-h-screen bg-white">
      {/* Progress Header */}
      <div className="w-full h-14 border-b border-slate-100 flex items-center px-4">
        <div className="max-w-5xl mx-auto w-full flex items-center gap-4 text-sm">
          <Link
            href="/onboarding"
            className="text-sky-600 font-semibold flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Create an organization
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-700 font-semibold">Add billing</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-400">Get integrated</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-400">Send an event</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto pt-12 px-4">
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-display-md font-semibold">
              Add billing information
            </h1>
            <p className="text-body-md text-slate-500">
              Start your 7-day free trial and get our most-loved features in
              Helicone Pro.
            </p>
          </div>

          {/* Pricing Card */}
          <div className="flex gap-6 flex-col md:flex-row">
            <div className="flex-1 p-6 border border-slate-100 rounded-lg shadow-sm">
              <div className="flex items-start justify-between mb-6">
                <div className="space-y-1">
                  <h3 className="text-heading-1 font-semibold">Helicone Pro</h3>
                  <p className="text-body-md text-slate-500">2 users</p>
                </div>
                <span className="text-heading-1 font-semibold">$40/mo</span>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-body-lg font-semibold">Add-ons</h4>
                  <div className="space-y-4">
                    {[
                      {
                        name: "Prompts",
                        price: "+$50/mo",
                        desc: "Track, version and iterate",
                      },
                      {
                        name: "Experiments",
                        price: "+$50/mo",
                        desc: "Test prompts at scale",
                      },
                      {
                        name: "Evals",
                        price: "+$100/mo",
                        desc: "Quantify LLM outputs",
                      },
                    ].map((addon) => (
                      <div
                        key={addon.name}
                        className="flex justify-between items-start"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-6 bg-sky-100 rounded-full p-0.5">
                            <div className="w-5 h-5 bg-white rounded-full shadow-sm" />
                          </div>
                          <div>
                            <p className="text-body-md font-medium">
                              {addon.name}
                            </p>
                            <p className="text-body-sm text-slate-500">
                              {addon.desc}
                            </p>
                          </div>
                        </div>
                        <span className="text-body-md text-slate-600">
                          {addon.price}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-body-lg text-slate-600">
                      Due Today
                    </span>
                    <span className="text-body-lg font-semibold">$0.00</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-body-sm text-slate-500">
                      Amount after trial
                    </span>
                    <span className="text-body-sm text-slate-500">
                      $240.00/mo
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Form */}
            <div className="flex-1 p-6 border border-slate-100 rounded-lg shadow-sm">
              <div className="space-y-6">
                <h3 className="text-heading-1 font-semibold">
                  Payment Details
                </h3>
                <Input
                  placeholder="Card number"
                  className="h-12 text-body-md"
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input placeholder="MM/YY" className="h-12 text-body-md" />
                  <Input placeholder="CVC" className="h-12 text-body-md" />
                </div>
                <Button className="w-full h-12 bg-sky-600 hover:bg-sky-700 text-body-md">
                  Start my trial
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
