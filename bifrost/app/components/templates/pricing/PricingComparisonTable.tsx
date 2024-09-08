import { useState } from "react";
import { CheckIcon, ChevronDownIcon } from "@heroicons/react/20/solid";
import { LockClosedIcon, LockOpenIcon } from "@heroicons/react/24/outline";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Col } from "@/components/common/col";
import { Row } from "@/components/common/row";

interface FeatureRowProps {
  title: string;
  description: string;
  isTeamPlan?: boolean;
  fullAccess?: boolean;
  amount?: string;
  unit?: string;
  thenStartingAt?: string;
}

const FeatureRow: React.FC<FeatureRowProps> = ({
  title,
  description,
  isTeamPlan = true,
  fullAccess = false,
  amount,
  unit,
  thenStartingAt,
}) => (
  <>
    <Col className="p-4 gap-[12px]">
      <Col className="gap-[4px]">
        <Row className="text-xl gap-[12px] items-center">
          <b>{title}</b>
          {fullAccess && (
            <>
              <LockOpenIcon className="w-5 h-5" />
              <div className="bg-[#E7F6FD] text-[#0CA5EA] px-[12px] py-[4px] rounded-[3px] text-[14px] font-medium">
                full access
              </div>
            </>
          )}
        </Row>
        <p className="text-[#7D7D7D]">{description}</p>
      </Col>
      <Row className="items-center gap-[4px] text-[#0CA5EA]">
        <div>How we calculate this</div>
        <ChevronDownIcon className="w-5 h-5" />
      </Row>
    </Col>
    <div className="p-4 max-w-[360px] items-end text-end justify-end flex flex-col gap-[12px] ">
      {isTeamPlan && <CheckIcon className="w-5 h-5 text-[#6AA84F]" />}
      {amount && (
        <div className="flex flex-col gap-[4px] text-[#7D7D7D]">
          <h3 className="text-[14px]">
            <b className="text-[18px] text-black font-bold">{amount}</b> {unit}
          </h3>
          {thenStartingAt && (
            <p className="font-light">
              then starting at <br />
              {thenStartingAt}
            </p>
          )}
        </div>
      )}
    </div>
  </>
);

export default function PricingComparisonTable() {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <div className="flex flex-col max-w-6xl mx-auto space-y-8 py-16 w-full">
      <h2 className="text-lg sm:text-2xl font-bold tracking-tight max-w-4xl pt-8">
        Compare plans
      </h2>

      <Tabs defaultValue="team" className="w-full">
        <Row className="justify-between items-center">
          <TabsList>
            <TabsTrigger value="developer">Developer</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
          </TabsList>
          <div className="text-sm text-gray-500 flex items-center gap-2">
            <span>Monthly</span>
            <Switch checked={isAnnual} onCheckedChange={setIsAnnual} />
            <span>Annual</span>
          </div>
        </Row>
        <TabsContent value="developer">
          <Card>
            <CardHeader>
              <CardTitle>Developer</CardTitle>
              <CardDescription>
                For most startups under two years old, we offer 50% off for the
                first year.
              </CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>
        <TabsContent value="team">
          <div className="w-full overflow-x-auto">
            <div className="min-w-[800px]">
              <Col className="rounded-lg border">
                <Row className="justify-between p-[24px] bg-[#F9F9F9] items-center">
                  <h1 className="text-2xl font-bold">Team plan</h1>
                  <Row className="items-center gap-[8px]">
                    <Row className="text-[18px] text-black font-semibold line-through">
                      ${isAnnual ? "600" : "50"}
                      {isAnnual ? "/yr" : "/mo"}
                    </Row>
                    <Row className="text-[36px] font-extrabold text-[#0CA5EA] items-center">
                      <Row>
                        <span className="text-[24px] pt-[7px]">$</span>
                        {isAnnual ? "480" : "40"}
                      </Row>
                      <span className="text-[18px]">
                        {isAnnual ? "/yr" : "/mo"}
                      </span>
                    </Row>
                  </Row>
                </Row>
                <div className="grid grid-cols-[1fr,auto] divide-x divide-y border-t">
                  <FeatureRow
                    title="Dashboard"
                    description="Visualize your LLM analytics, and watch your AI app improve."
                  />
                  <FeatureRow
                    title="Requests"
                    description="First 10,000 requests free - every month!"
                    amount="10k"
                    unit="/mo"
                    thenStartingAt="$0.65 per 10k requests"
                  />
                  <FeatureRow
                    title="Prompts"
                    description="Requests individual requests logged within the Helicone platform. Blah blah blah this."
                    fullAccess
                    amount="3"
                    unit="/mo"
                    thenStartingAt="$0.001 per prompt"
                  />
                  <FeatureRow
                    title="Exported requests"
                    description="Requests individual requests logged within the Helicone platform. Blah blah blah this."
                    fullAccess
                    amount="5k"
                    unit="/mo"
                    thenStartingAt="$0.001 per requests"
                  />
                  <FeatureRow
                    title="Evals"
                    description="Requests individual requests logged within the Helicone platform. Blah blah blah this."
                    fullAccess
                    amount="1k"
                    unit="/mo"
                    thenStartingAt="$0.001 per requests"
                  />
                  <FeatureRow
                    title="Datasets"
                    description="Requests individual requests logged within the Helicone platform. Blah blah blah this."
                    fullAccess
                    amount="1k"
                    unit="/mo"
                    thenStartingAt="$0.001 per requests"
                  />
                </div>
              </Col>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
