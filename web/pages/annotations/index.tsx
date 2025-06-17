import { useState } from "react";
import { useRouter } from "next/router";
import { useJawnClient } from "@/lib/clients/jawnHook";
import BasePageV2 from "@/components/layout/basePageV2";
import { H2, P, Lead } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import AuthLayout from "@/components/layout/auth/authLayout";
import { ChevronRight, FileText, Users, BarChart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import LoadingAnimation from "@/components/shared/loadingAnimation";
import { formatRelative } from "date-fns";

interface DatasetWithStats {
  id: string;
  name: string;
  created_at: string;
  rowCount: number;
  pendingAnnotations: number;
  completedAnnotations: number;
  annotatorCount: number;
}

const AnnotationsPage = () => {
  const router = useRouter();
  const jawnClient = useJawnClient();
  
  // Fetch datasets with annotation statistics
  const { data: datasets, isLoading } = useQuery({
    queryKey: ["datasets-with-annotations"],
    queryFn: async () => {
      // Fetch all datasets
      const datasetsResult = await jawnClient.POST("/v1/helicone-dataset/query", {
        body: {}
      });
      
      if (!datasetsResult.response.ok || !datasetsResult.data?.data) {
        return [];
      }
      
      // For each dataset, fetch annotation stats
      const datasetsWithStats = await Promise.all(
        datasetsResult.data.data.map(async (dataset) => {
          const statsResult = await jawnClient.GET(
            "/v1/annotation/dataset/{datasetId}/ab/stats",
            {
              params: {
                path: {
                  datasetId: dataset.id
                }
              }
            }
          );
          
          const stats = statsResult.data?.data || {
            total: 0,
            choice_a_count: 0,
            choice_b_count: 0,
            annotators_count: 0
          };
          
          // Mock some pending annotations for demo
          const pendingAnnotations = Math.max(0, 10 - stats.total);
          
          return {
            id: dataset.id,
            name: dataset.name || "Unnamed Dataset",
            created_at: dataset.created_at || new Date().toISOString(),
            rowCount: dataset.requests_count || 0,
            pendingAnnotations,
            completedAnnotations: stats.total,
            annotatorCount: stats.annotators_count
          };
        })
      );
      
      // Sort by pending annotations (most first)
      return datasetsWithStats.sort((a, b) => b.pendingAnnotations - a.pendingAnnotations);
    }
  });

  const handleStartAnnotating = (datasetId: string) => {
    router.push(`/annotations/queue?datasetId=${datasetId}`);
  };

  return (
    <AuthLayout>
      <BasePageV2>
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <H2>Annotations</H2>
            <Lead className="text-muted-foreground">
              Review and annotate dataset responses for A/B testing
            </Lead>
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <LoadingAnimation />
            </div>
          )}

          {/* Empty state */}
          {!isLoading && (!datasets || datasets.length === 0) && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-20">
                <FileText size={48} className="mb-4 text-muted-foreground" />
                <H2 className="mb-2">No datasets found</H2>
                <P className="mb-4 text-muted-foreground">
                  Create a dataset first to start annotating
                </P>
                <Button onClick={() => router.push("/datasets")}>
                  Go to Datasets
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Datasets list */}
          {!isLoading && datasets && datasets.length > 0 && (
            <div className="grid gap-4">
              {datasets.map((dataset) => (
                <Card key={dataset.id} className="overflow-hidden">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">{dataset.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Created {formatRelative(new Date(dataset.created_at), new Date())}
                        </p>
                      </div>
                      {dataset.pendingAnnotations > 0 ? (
                        <Button
                          variant="action"
                          size="sm"
                          onClick={() => handleStartAnnotating(dataset.id)}
                        >
                          Start Annotating
                          <ChevronRight size={16} className="ml-1" />
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/datasets/${dataset.id}`)}
                        >
                          View Dataset
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Total Rows</p>
                          <p className="font-medium">{dataset.rowCount}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <BarChart size={16} className="text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Pending</p>
                          <p className="font-medium text-orange-600">
                            {dataset.pendingAnnotations}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <BarChart size={16} className="text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Completed</p>
                          <p className="font-medium text-green-600">
                            {dataset.completedAnnotations}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Annotators</p>
                          <p className="font-medium">{dataset.annotatorCount}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </BasePageV2>
    </AuthLayout>
  );
};

export default AnnotationsPage; 