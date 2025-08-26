import FoldedHeader from "@/components/shared/FoldedHeader";

import { Small } from "@/components/ui/typography";
import { Tabs, TabsContent } from "@/components/ui/tabs";

import DefaultAIGateway from "./defaultAIGateway";
import { useState } from "react";

const GatewayPage = () => {
  const [tabValue, setTabValue] = useState<string>("/ai");

  return (
    <main className="flex w-full animate-fade-in flex-col">
      <Tabs value={tabValue} onValueChange={setTabValue}>
        <FoldedHeader
          showFold={false}
          leftSection={
            <div className="flex items-center gap-1">
              <Small className="font-bold text-gray-500 dark:text-slate-300">
                AI Gateway
              </Small>
            </div>
          }
        />

        <TabsContent value="/ai">
          <DefaultAIGateway
            setTabValue={() => {
              setTabValue("/router");
            }}
          />
        </TabsContent>
 
      </Tabs>
    </main>
  );
};

export default GatewayPage;
