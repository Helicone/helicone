import React from "react";
import { useEvaluators } from "./EvaluatorHook";
import AuthHeader from "@/components/shared/authHeader";
import { Button } from "@/components/ui/button";
import { PiPlusBold } from "react-icons/pi";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { H2, P } from "@/components/ui/typography";
import Link from "next/link";
import { LineChart, Pencil, Play, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import GenericEmptyState from "@/components/shared/helicone/GenericEmptyState";
import useNotification from "@/components/shared/notification/useNotification";

export default function EvaluatorsList() {
  const { evaluators, deleteEvaluator } = useEvaluators();
  const notification = useNotification();

  // Helper to format date strings
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Handle delete with confirmation
  const handleDelete = async (id: string, name: string) => {
    if (
      window.confirm(`Are you sure you want to delete evaluator "${name}"?`)
    ) {
      try {
        await deleteEvaluator.mutateAsync(id);
        notification.setNotification(
          `Successfully deleted "${name}"`,
          "success"
        );
      } catch (error) {
        notification.setNotification("Failed to delete evaluator", "error");
      }
    }
  };

  // Loading state
  if (evaluators.isLoading) {
    return (
      <div className="w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <H2>Evaluators</H2>
        </div>
        <Card className="w-full p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-5/6"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </Card>
      </div>
    );
  }

  // Get data from API response
  const evaluatorsList = evaluators.data?.data?.data || [];

  // Empty state
  if (evaluatorsList.length === 0) {
    return (
      <div>
        <AuthHeader
          title="Evaluators"
          actions={[
            <Link href="/evaluators/new" key="create-evaluator">
              <Button variant="action" size="sm" className="gap-1 items-center">
                <PiPlusBold className="h-3.5 w-3.5" />
                Create Evaluator
              </Button>
            </Link>,
          ]}
        />
        <div className="p-6">
          <GenericEmptyState
            title="Create Your First Evaluator"
            description="Create an evaluator to score your LLM outputs and measure their quality."
            icon={<LineChart size={28} className="text-accent-foreground" />}
            className="w-full"
            actions={
              <Link href="/evaluators/new">
                <Button variant="default">
                  Create Evaluator
                  <PiPlusBold className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <AuthHeader
        title="Evaluators"
        actions={[
          <Link href="/evaluators/new" key="create-evaluator">
            <Button variant="action" size="sm" className="gap-1 items-center">
              <PiPlusBold className="h-3.5 w-3.5" />
              Create Evaluator
            </Button>
          </Link>,
        ]}
      />
      <div className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Scoring</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {evaluatorsList.map((evaluator) => {
              // Determine evaluator type
              let type = "Default";
              if (evaluator.llm_template) {
                type = "LLM";
              } else if (evaluator.code_template) {
                type = "Python";
              } else if (evaluator.last_mile_config) {
                type = "LastMile";
              }

              return (
                <TableRow key={evaluator.id}>
                  <TableCell className="font-medium">
                    {evaluator.name}
                  </TableCell>
                  <TableCell>{type}</TableCell>
                  <TableCell>{evaluator.scoring_type}</TableCell>
                  <TableCell>
                    {evaluator.created_at
                      ? formatDate(evaluator.created_at)
                      : "N/A"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/evaluators/${evaluator.id}`}>
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/evaluators/test/${evaluator.id}`}>
                          <Play className="h-4 w-4" />
                          <span className="sr-only">Test</span>
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleDelete(evaluator.id, evaluator.name)
                        }
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
