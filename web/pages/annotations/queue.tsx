import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useJawnClient } from "@/lib/clients/jawnHook";
import BasePageV2 from "@/components/layout/basePageV2";
import { H2, P, Lead } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle2, ChevronRight, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useOrg } from "@/components/layout/org/organizationContext";
import AuthLayout from "@/components/layout/auth/authLayout";
import LoadingAnimation from "@/components/shared/loadingAnimation";
import useNotification from "@/components/shared/notification/useNotification";
import { cn } from "@/lib/utils";

interface AnnotationQueue {
  datasetId: string;
  datasetRowId: string;
  requestId: string;
  prompt: string;
  responseA: string;
  responseB: string;
}

const AnnotationQueuePage = () => {
  const router = useRouter();
  const { datasetId } = router.query;
  const jawnClient = useJawnClient();
  const org = useOrg();
  const { setNotification } = useNotification();
  
  const [selected, setSelected] = useState<"a" | "b" | null>(null);
  const [reasoning, setReasoning] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [queue, setQueue] = useState<AnnotationQueue[]>([]);
  
  // Fetch dataset rows that need annotation
  const { data: datasetRows, isLoading } = useQuery({
    queryKey: ["dataset-rows", datasetId],
    queryFn: async () => {
      if (!datasetId) return [];
      
      // Fetch dataset rows
      const rowsResult = await jawnClient.POST("/v1/helicone-dataset/{datasetId}/query", {
        params: {
          path: {
            datasetId: datasetId as string
          }
        },
        body: {
          limit: 50,
          offset: 0
        }
      });
      
      if (!rowsResult.response.ok || !rowsResult.data?.data) {
        return [];
      }
      
      // For demo purposes, create sample annotation queue
      // In production, you would fetch actual request/response data from the signed URLs
      const annotationQueue: AnnotationQueue[] = rowsResult.data.data
        .slice(0, 5) // Limit to first 5 for demo
        .map((row, index) => {
          // In production, you would:
          // 1. Fetch data from row.signed_url if it has data
          // 2. Parse the request/response to extract prompts and responses
          
          // Demo data for now
          const samplePrompts = [
            "Explain quantum computing in simple terms",
            "What are the benefits of meditation?",
            "How does machine learning work?",
            "What causes climate change?",
            "Explain the concept of blockchain"
          ];
          
          const sampleResponsesA = [
            "Quantum computing uses quantum bits (qubits) that can be both 0 and 1 at the same time, unlike regular computers that use bits that are either 0 or 1. This allows quantum computers to solve certain problems much faster.",
            "Meditation helps reduce stress, improve focus, enhance emotional well-being, and can even boost physical health by lowering blood pressure and improving sleep quality.",
            "Machine learning is when computers learn patterns from data without being explicitly programmed. They use algorithms to find patterns and make predictions based on examples they've seen.",
            "Climate change is primarily caused by greenhouse gases like CO2 trapping heat in Earth's atmosphere. These gases come mainly from burning fossil fuels, deforestation, and industrial processes.",
            "Blockchain is a digital ledger that records transactions across many computers. Each 'block' contains transaction data and is linked to previous blocks, creating a secure chain that's hard to tamper with."
          ];
          
          const sampleResponsesB = [
            "Quantum computing is like having a magical computer that can try many solutions at once. While normal computers check answers one by one, quantum computers can explore multiple possibilities simultaneously.",
            "Regular meditation practice offers numerous benefits: stress reduction, increased self-awareness, improved concentration, better emotional regulation, and enhanced overall mental and physical health.",
            "Machine learning allows computers to learn from experience. Instead of following pre-written rules, ML systems analyze data, identify patterns, and improve their performance over time through training.",
            "Human activities are warming the planet. Burning coal, oil, and gas releases CO2. Cutting down forests removes natural CO2 absorbers. These actions trap heat in our atmosphere, changing our climate.",
            "Think of blockchain as a shared notebook that everyone can read but no one can erase. When someone adds a new page (block), everyone gets a copy, making it nearly impossible to cheat or change old entries."
          ];
          
          return {
            datasetId: datasetId as string,
            datasetRowId: row.id,
            requestId: row.origin_request_id,
            prompt: samplePrompts[index % samplePrompts.length],
            responseA: sampleResponsesA[index % sampleResponsesA.length],
            responseB: sampleResponsesB[index % sampleResponsesB.length]
          };
        });
      
      return annotationQueue;
    },
    enabled: !!datasetId
  });

  useEffect(() => {
    if (datasetRows) {
      setQueue(datasetRows);
    }
  }, [datasetRows]);

  const currentAnnotation = queue[currentIndex];

  const handleSubmit = async () => {
    if (!selected || !currentAnnotation) return;
    
    try {
      const result = await jawnClient.POST("/v1/annotation/ab", {
        body: {
          datasetId: currentAnnotation.datasetId,
          datasetRowId: currentAnnotation.datasetRowId,
          requestId: currentAnnotation.requestId,
          prompt: currentAnnotation.prompt,
          responseA: currentAnnotation.responseA,
          responseB: currentAnnotation.responseB,
          choice: selected
        }
      });

      if (result.response.ok) {
        setNotification("Annotation submitted successfully!", "success");
        
        // Move to next item in queue
        if (currentIndex < queue.length - 1) {
          setCurrentIndex(currentIndex + 1);
          setSelected(null);
          setReasoning("");
        } else {
          // No more items in queue
          setNotification("All annotations completed!", "success");
          router.push("/datasets");
        }
      } else {
        setNotification("Failed to submit annotation", "error");
      }
    } catch (error) {
      console.error("Error submitting annotation:", error);
      setNotification("Error submitting annotation", "error");
    }
  };

  const handleGenerateResponse = (response: "a" | "b") => {
    setNotification(`Regenerating response ${response.toUpperCase()}...`, "info");
    // TODO: Implement response regeneration
  };

  if (isLoading) {
    return (
      <AuthLayout>
        <BasePageV2>
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <LoadingAnimation />
            <P className="text-muted-foreground">Loading annotations...</P>
          </div>
        </BasePageV2>
      </AuthLayout>
    );
  }

  if (!currentAnnotation) {
    return (
      <AuthLayout>
        <BasePageV2>
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <H2>No annotations in queue</H2>
            <P className="text-muted-foreground mb-4">
              {!datasetId 
                ? "No dataset selected" 
                : "All items in this dataset have been annotated"}
            </P>
            <Button onClick={() => router.push("/annotations")}>
              Back to Annotations
            </Button>
          </div>
        </BasePageV2>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <BasePageV2>
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <H2>Annotation Queue</H2>
              <Lead className="text-muted-foreground">
                Compare responses and select the better one
              </Lead>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{currentIndex + 1} of {queue.length}</span>
            </div>
          </div>

          {/* Task Information */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <div className="text-sm font-medium">Task Prompt</div>
            </CardHeader>
            <CardContent>
              <P>{currentAnnotation.prompt}</P>
            </CardContent>
          </Card>

          {/* Response Comparison */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Response A */}
            <Card className={cn(
              "relative transition-all",
              selected === "a" && "ring-2 ring-primary"
            )}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Response A</div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleGenerateResponse("a")}
                  >
                    <RefreshCw size={14} className="mr-1" />
                    Generate
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <P className="text-sm">{currentAnnotation.responseA}</P>
                <Button
                  variant={selected === "a" ? "action" : "outline"}
                  className="w-full"
                  onClick={() => setSelected("a")}
                >
                  {selected === "a" && <CheckCircle2 size={16} className="mr-2" />}
                  This is better!
                </Button>
              </CardContent>
            </Card>

            {/* Response B */}
            <Card className={cn(
              "relative transition-all",
              selected === "b" && "ring-2 ring-primary"
            )}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Response B</div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleGenerateResponse("b")}
                  >
                    <RefreshCw size={14} className="mr-1" />
                    Generate
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <P className="text-sm">{currentAnnotation.responseB}</P>
                <Button
                  variant={selected === "b" ? "action" : "outline"}
                  className="w-full"
                  onClick={() => setSelected("b")}
                >
                  {selected === "b" && <CheckCircle2 size={16} className="mr-2" />}
                  This is better!
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Reasoning Input */}
          <Card className="mt-6">
            <CardHeader className="pb-3">
              <Label htmlFor="reasoning">Reasoning (Optional)</Label>
            </CardHeader>
            <CardContent>
              <Textarea
                id="reasoning"
                placeholder="Explain why you chose this response..."
                value={reasoning}
                onChange={(e) => setReasoning(e.target.value)}
                className="min-h-[100px]"
              />
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="mt-6 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => router.push("/datasets")}
            >
              Cancel
            </Button>
            <Button
              variant="action"
              size="lg"
              onClick={handleSubmit}
              disabled={!selected}
            >
              Submit
              <ChevronRight size={16} className="ml-2" />
            </Button>
          </div>
        </div>
      </BasePageV2>
    </AuthLayout>
  );
};

export default AnnotationQueuePage; 