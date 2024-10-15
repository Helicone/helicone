import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useMutation, useQuery } from "@tanstack/react-query";
import { XIcon } from "lucide-react";
import { useState } from "react";
import { getJawnClient } from "../../../lib/clients/jawn";
import { useOrg } from "../../layout/organizationContext";

interface FeatureFlagCardProps {
  flag: {
    name: string;
    flags: string[];
    organization_id: string;
  };
  onMutate?: () => void;
}

export const FeatureFlagCard: React.FC<FeatureFlagCardProps> = ({
  flag,
  onMutate,
}) => {
  const [newFlag, setNewFlag] = useState("");
  const org = useOrg();

  const addFeatureFlag = useMutation({
    mutationFn: async (params: { flag: string; orgId: string }) => {
      const { flag, orgId } = params;
      const jawn = getJawnClient(org?.currentOrg?.id);
      const { error } = await jawn.POST(`/v1/admin/feature-flags`, {
        body: {
          flag,
          orgId,
        },
      });
    },
    onSuccess: () => {
      onMutate?.();
    },
  });

  const deleteFeatureFlag = useMutation({
    mutationFn: async (params: { flag: string; orgId: string }) => {
      const { flag, orgId } = params;
      const jawn = getJawnClient(org?.currentOrg?.id);
      await jawn.DELETE(`/v1/admin/feature-flags`, {
        body: { flag, orgId },
      });
    },
    onSuccess: () => {
      onMutate?.();
    },
  });

  const handleRemoveFlag = (flagToRemove: string) => {
    deleteFeatureFlag.mutate({
      flag: flagToRemove,
      orgId: flag.organization_id,
    });
  };

  return (
    <Card key={flag.organization_id}>
      <CardContent className="pt-6">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold">
            {flag.name}

            <h2 className="text-sm text-gray-500">{flag.organization_id}</h2>
          </h3>

          <div className="flex flex-wrap gap-2">
            {flag.flags.map((f) => (
              <Badge
                key={f}
                variant="secondary"
                className="flex items-center gap-2"
              >
                {f}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0"
                  onClick={() => handleRemoveFlag(f)}
                >
                  <span className="sr-only">Remove</span>
                  <XIcon className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <Input
            type="text"
            placeholder="Add new flag"
            className="flex-grow"
            value={newFlag}
            onChange={(e) => setNewFlag(e.target.value)}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              addFeatureFlag.mutate({
                flag: newFlag,
                orgId: flag.organization_id,
              });
            }}
          >
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export const AdminFeatureFlags = () => {
  const org = useOrg();
  const [newFeatureFlag, setNewFeatureFlag] = useState("");

  const [selectedOrgId, setSelectedOrgId] = useState<string>("");

  const featureFlags = useQuery({
    queryKey: ["admin-feature-flags", org?.currentOrg?.id],
    queryFn: async (query) => {
      const jawn = getJawnClient(query.queryKey[1]);
      const { data, error } = await jawn.POST(
        `/v1/admin/feature-flags/query`,
        {}
      );
      return data;
    },
  });

  const addFeatureFlag = useMutation({
    mutationFn: async (params: { flag: string; orgId: string }) => {
      const { flag, orgId } = params;
      const jawn = getJawnClient(org?.currentOrg?.id);
      const { error } = await jawn.POST(`/v1/admin/feature-flags`, {
        body: {
          flag,
          orgId,
        },
      });
    },
    onSuccess: () => {
      featureFlags.refetch();
    },
  });

  return (
    <Card className="w-full max-w-4xl mx-auto bg-gray-200">
      <CardHeader>
        <CardTitle>Admin Feature Flags</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex space-x-2">
          <Input
            type="text"
            value={newFeatureFlag}
            onChange={(e) => setSelectedOrgId(e.target.value)}
            placeholder="Organization ID"
            className="flex-grow"
          />
          <Input
            type="text"
            value={newFeatureFlag}
            onChange={(e) => setNewFeatureFlag(e.target.value)}
            placeholder="Enter new feature flag"
            className="flex-grow"
          />
          <Button
            onClick={() => {
              addFeatureFlag.mutate({
                flag: newFeatureFlag,
                orgId: selectedOrgId,
              });
            }}
          >
            Add Flag
          </Button>
        </div>

        <div className="space-y-4">
          {featureFlags.data?.data?.map((flag) => (
            <FeatureFlagCard
              key={flag.organization_id}
              flag={flag}
              onMutate={featureFlags.refetch}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
