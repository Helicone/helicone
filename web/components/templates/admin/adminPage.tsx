import AlertBanners from "./panels/alertBanners";
import KafkaSettings from "./panels/kafkaSettings";
import OrgMember from "./panels/orgMember";
import { H1, Muted } from "@/components/ui/typography";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Settings, Users, BellRing } from "lucide-react";

interface AdminPageProps {}

const AdminPage = (props: AdminPageProps) => {
  const {} = props;

  return (
    <div className="flex flex-col space-y-8 w-full max-w-6xl py-6">
      <Tabs defaultValue="alerts" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <BellRing className="h-4 w-4" />
            Alert Banners
          </TabsTrigger>
          <TabsTrigger value="org-members" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Organization Management
          </TabsTrigger>
          <TabsTrigger value="kafka" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Kafka Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="mt-0">
          <AlertBanners />
        </TabsContent>

        <TabsContent value="org-members" className="mt-0">
          <OrgMember />
        </TabsContent>

        <TabsContent value="kafka" className="mt-0">
          <KafkaSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPage;
