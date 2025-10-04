import { useState } from "react";
import { providers, ModelRow, ModelWithProvider } from "@helicone-package/cost";
import {
  ChevronDown,
  ChevronRight,
  Check,
  Minus,
  Eye,
  Play,
  AlertTriangle,
  RefreshCw,
  BarChart3,
} from "lucide-react";
import { H3, P, Small, Muted } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import {
  useBackfillCosts,
  useBackfillCostsPreview,
  useDeduplicateRequestResponse,
} from "@/services/hooks/admin";
import { toast } from "sonner";
import { logger } from "@/lib/telemetry/logger";

interface SelectableModelWithProvider extends ModelWithProvider {
  selected: boolean;
}

const CostBackfiller = () => {
  const [allModels, setAllModels] = useState<SelectableModelWithProvider[]>(
    () => {
      return providers
        .filter((p) => p.costs !== undefined)
        .flatMap((provider) =>
          provider.costs!.map((modelRow) => ({
            provider: provider.provider,
            modelRow,
            selected: false,
          })),
        );
    },
  );

  const [expandedProviders, setExpandedProviders] = useState<Set<string>>(
    new Set(),
  );
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [queryPreview, setQueryPreview] = useState<string>("");
  const [backfillError, setBackfillError] = useState<string | null>(null);
  const [previewResults, setPreviewResults] = useState<{
    withCosts: {
      results: Array<{ model: string; provider: string; count: string }>;
      totalCount: number;
    } | null;
    withoutCosts: {
      results: Array<{ model: string; provider: string; count: string }>;
      totalCount: number;
    } | null;
  }>({
    withCosts: null,
    withoutCosts: null,
  });

  const { backfillCostsAsync, isBackfillingCosts } =
    useBackfillCosts(() => {
      toast.success("Cost backfill completed successfully!");
      setQueryPreview("");
      setBackfillError(null); // Clear error on success
    });

  const { backfillCostsPreviewAsync, isLoadingPreview } =
    useBackfillCostsPreview();

  const { deduplicateAsync, isDeduplicating } = useDeduplicateRequestResponse(
    () => {
      toast.success(
        "Deduplication completed successfully! This operation may take some time to fully process.",
      );
    },
  );

  const modelsByProvider = allModels.reduce(
    (acc, model) => {
      if (!acc[model.provider]) {
        acc[model.provider] = [];
      }
      acc[model.provider].push(model);
      return acc;
    },
    {} as Record<string, SelectableModelWithProvider[]>,
  );

  const validateDateFormat = (date: string): boolean => {
    if (!date.trim()) return true;
    const pattern = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}$/;
    return pattern.test(date);
  };

  const isFromDateValid = validateDateFormat(fromDate);
  const isToDateValid = validateDateFormat(toDate);

  const toggleProvider = (provider: string) => {
    setExpandedProviders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(provider)) {
        newSet.delete(provider);
      } else {
        newSet.add(provider);
      }
      return newSet;
    });
  };

  const toggleProviderSelection = (provider: string) => {
    const providerModels = modelsByProvider[provider];
    const allSelected = providerModels.every((m) => m.selected);

    setAllModels((prev) =>
      prev.map((model) =>
        model.provider === provider
          ? { ...model, selected: !allSelected }
          : model,
      ),
    );
  };

  const toggleModelSelection = (modelIndex: number) => {
    setAllModels((prev) =>
      prev.map((model, index) =>
        index === modelIndex ? { ...model, selected: !model.selected } : model,
      ),
    );
  };

  const selectedModels = allModels.filter((m) => m.selected);
  const hasSelections = selectedModels.length > 0;

  const formatCost = (cost: ModelRow["cost"]) => {
    const parts = [];
    if (cost.prompt_token)
      parts.push(`Input: $${cost.prompt_token.toExponential(2)}`);
    if (cost.completion_token)
      parts.push(`Output: $${cost.completion_token.toExponential(2)}`);
    return parts.join(", ");
  };

  const getProviderSelectionState = (provider: string) => {
    const providerModels = modelsByProvider[provider];
    const selectedCount = providerModels.filter((m) => m.selected).length;
    const allSelected = selectedCount === providerModels.length;
    const someSelected =
      selectedCount > 0 && selectedCount < providerModels.length;
    return { allSelected, someSelected };
  };

  const handleCheckCounts = async () => {
    if (!hasSelections) {
      toast.error("Please select at least one model to check");
      return;
    }

    if (!isFromDateValid || !isToDateValid) {
      toast.error("Please fix the date format errors");
      return;
    }

    try {
      const models = selectedModels.map((m) => ({
        provider: m.provider,
        modelRow: m.modelRow,
      }));

      const [withCostsResult, withoutCostsResult] = await Promise.all([
        backfillCostsPreviewAsync({
          models,
          hasCosts: true,
          fromDate: fromDate.trim() || undefined,
          toDate: toDate.trim() || undefined,
        }),
        backfillCostsPreviewAsync({
          models,
          hasCosts: false,
          fromDate: fromDate.trim() || undefined,
          toDate: toDate.trim() || undefined,
        }),
      ]);

      if (withCostsResult.error || withoutCostsResult.error) {
        toast.error(
          `Error checking counts: ${withCostsResult.error || withoutCostsResult.error}`,
        );
        return;
      }

      setPreviewResults({
        withCosts: withCostsResult.data
          ? {
              results: withCostsResult.data.results,
              totalCount: withCostsResult.data.totalCount,
            }
          : null,
        withoutCosts: withoutCostsResult.data
          ? {
              results: withoutCostsResult.data.results,
              totalCount: withoutCostsResult.data.totalCount,
            }
          : null,
      });

      toast.success("Row counts retrieved successfully!");
    } catch (error) {
      toast.error("Failed to check row counts");
      logger.error(
        {
          error,
          selectedModelsCount: selectedModels.length,
        },
        "Failed to check row counts",
      );
    }
  };

  const handlePreviewQuery = async () => {
    if (!hasSelections) {
      toast.error("Please select at least one model to backfill");
      return;
    }

    if (!isFromDateValid || !isToDateValid) {
      toast.error("Please fix the date format errors");
      return;
    }

    try {
      const result = await backfillCostsAsync({
        models: selectedModels.map((m) => ({
          provider: m.provider,
          modelRow: m.modelRow,
        })),
        confirmed: false, // Preview mode
        fromDate: fromDate.trim() || undefined,
        toDate: toDate.trim() || undefined,
      });

      if (result.error) {
        toast.error(`Error generating query: ${result.error}`);
        return;
      }

      if (result.data?.query) {
        setQueryPreview(result.data.query);
        toast.success("Query preview generated!");
      }
    } catch (error) {
      toast.error("Failed to generate query preview");
      logger.error(
        {
          error,
          selectedModelsCount: selectedModels.length,
        },
        "Failed to generate query preview",
      );
    }
  };

  const handleExecuteQuery = async () => {
    if (!queryPreview) {
      toast.error("Please preview the query first");
      return;
    }

    if (!confirmed) {
      toast.error(
        "Please confirm the operation by toggling the confirm switch",
      );
      return;
    }

    // Clear any previous errors
    setBackfillError(null);

    try {
      const result = await backfillCostsAsync({
        models: selectedModels.map((m) => ({
          provider: m.provider,
          modelRow: m.modelRow,
        })),
        confirmed: true,
        fromDate: fromDate.trim() || undefined,
        toDate: toDate.trim() || undefined,
      });

      if (result.error) {
        const errorMessage = `Error executing backfill: ${result.error}`;
        setBackfillError(errorMessage);
        toast.error(errorMessage);
        return;
      }

      // Success is handled in the onSuccess callback
    } catch (error) {
      const errorMessage = `Failed to execute cost backfill: ${error instanceof Error ? error.message : "Unknown error"}`;
      setBackfillError(errorMessage);
      toast.error("Failed to execute cost backfill");
      logger.error(
        {
          error,
          selectedModelsCount: selectedModels.length,
        },
        "Failed to execute cost backfill",
      );
    }
  };

  const handleDeduplicate = async () => {
    try {
      const result = await deduplicateAsync();

      if (result.error) {
        toast.error(`Error during deduplication: ${result.error}`);
        return;
      }
    } catch (error) {
      toast.error("Failed to deduplicate request response table");
      logger.error(
        {
          error,
        },
        "Failed to deduplicate request response table",
      );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            1
          </div>
          <H3>Select Models to Backfill</H3>
        </div>

        <div className="mt-4 rounded-md border border-border bg-card">
          <div className="max-h-96 overflow-y-auto">
            {Object.entries(modelsByProvider).map(([provider, models]) => {
              const { allSelected, someSelected } =
                getProviderSelectionState(provider);
              const isExpanded = expandedProviders.has(provider);

              return (
                <div
                  key={provider}
                  className="border-b border-border last:border-b-0"
                >
                  <div className="flex items-center gap-2 p-3 hover:bg-accent/50">
                    <button
                      onClick={() => toggleProvider(provider)}
                      className="flex flex-1 items-center gap-2 text-left"
                    >
                      {isExpanded ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                      <span className="font-medium">{provider}</span>
                      <Small className="text-muted-foreground">
                        ({models.length} models)
                      </Small>
                    </button>

                    <button
                      onClick={() => toggleProviderSelection(provider)}
                      className="flex h-5 w-5 items-center justify-center rounded border border-border bg-background hover:bg-accent"
                    >
                      {allSelected && <Check size={14} />}
                      {someSelected && <Minus size={14} />}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="pb-2 pl-6">
                      {models.map((model, localIndex) => {
                        const globalIndex = allModels.findIndex(
                          (m) =>
                            m.provider === model.provider &&
                            m.modelRow.model.value ===
                              model.modelRow.model.value &&
                            m.modelRow.model.operator ===
                              model.modelRow.model.operator,
                        );

                        return (
                          <div
                            key={`${model.modelRow.model.value}-${model.modelRow.model.operator}`}
                            className="flex items-center gap-3 rounded px-2 py-2 hover:bg-accent/30"
                          >
                            <button
                              onClick={() => toggleModelSelection(globalIndex)}
                              className="flex h-4 w-4 items-center justify-center rounded border border-border bg-background hover:bg-accent"
                            >
                              {model.selected && <Check size={12} />}
                            </button>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono truncate text-sm">
                                  {model.modelRow.model.value}
                                </span>
                                <Small className="text-muted-foreground">
                                  ({model.modelRow.model.operator})
                                </Small>
                              </div>
                              <Muted className="text-xs">
                                {formatCost(model.modelRow.cost)}
                              </Muted>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {hasSelections && (
          <div className="mt-4 rounded-md border border-border bg-muted/50 p-3">
            <Small className="font-medium">
              Selected: {selectedModels.length} models across{" "}
              {new Set(selectedModels.map((m) => m.provider)).size} providers
            </Small>
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            2
          </div>
          <H3>Specify Date Range</H3>
        </div>
        <P className="text-muted-foreground">
          If no From Date is specified, then it will backfill everything. If no
          To Date is specified, then it will backfill until now()
        </P>

        <div className="flex flex-col gap-2">
          <div>
            <label className="mb-2 block text-sm font-medium">
              From Date (Optional)
            </label>
            <input
              type="text"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              placeholder="YYYY-MM-DD HH:MM:SS.XXX"
              className={`font-mono w-full rounded-md border px-3 py-2 text-sm ${
                isFromDateValid
                  ? "border-border"
                  : "border-destructive bg-destructive/5"
              }`}
            />
            {!isFromDateValid && (
              <Small className="mt-1 text-destructive">
                Invalid format. Use: YYYY-MM-DD HH:MM:SS.XXX
              </Small>
            )}
            {isFromDateValid && fromDate && (
              <Muted className="mt-1 text-xs">
                Example: 2024-01-15 10:30:45.123
              </Muted>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              To Date (Optional)
            </label>
            <input
              type="text"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              placeholder="YYYY-MM-DD HH:MM:SS.XXX"
              className={`font-mono w-full rounded-md border px-3 py-2 text-sm ${
                isToDateValid
                  ? "border-border"
                  : "border-destructive bg-destructive/5"
              }`}
            />
            {!isToDateValid && (
              <Small className="mt-1 text-destructive">
                Invalid format. Use: YYYY-MM-DD HH:MM:SS.XXX
              </Small>
            )}
            {isToDateValid && toDate && (
              <Muted className="mt-1 text-xs">
                Example: 2024-01-15 23:59:59.999
              </Muted>
            )}
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            3
          </div>
          <H3>Check Current Row Counts</H3>
        </div>
        <P className="text-muted-foreground">
          Check how many rows currently have costs vs. those that need
          backfilling.
        </P>

        <div className="mt-4">
          <Button
            onClick={handleCheckCounts}
            disabled={
              !hasSelections ||
              !isFromDateValid ||
              !isToDateValid ||
              isLoadingPreview
            }
            variant="outline"
            className="w-full"
          >
            {isLoadingPreview ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
                Checking Counts...
              </>
            ) : (
              <>
                <BarChart3 size={16} className="mr-2" />
                Check Row Counts
              </>
            )}
          </Button>
        </div>

        {(previewResults.withCosts || previewResults.withoutCosts) && (
          <div className="mt-4 space-y-4">
            {previewResults.withoutCosts && (
              <div className="rounded-md border border-border bg-card p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Small className="font-medium text-destructive">
                    Rows WITHOUT costs (need backfilling):{" "}
                    {previewResults.withoutCosts.totalCount.toLocaleString()}
                  </Small>
                </div>
                {previewResults.withoutCosts.results.length > 0 && (
                  <div className="max-h-32 overflow-y-auto">
                    <div className="space-y-1">
                      {previewResults.withoutCosts.results
                        .slice(0, 10)
                        .map((row, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between text-xs"
                          >
                            <span className="font-mono">
                              {row.provider} - {row.model}
                            </span>
                            <span className="text-muted-foreground">
                              {parseInt(row.count).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      {previewResults.withoutCosts.results.length > 10 && (
                        <Small className="text-muted-foreground">
                          ... and{" "}
                          {previewResults.withoutCosts.results.length - 10} more
                        </Small>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {previewResults.withCosts && (
              <div className="rounded-md border border-border bg-card p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Small className="font-medium text-confirmative">
                    Rows WITH costs (already processed):{" "}
                    {previewResults.withCosts.totalCount.toLocaleString()}
                  </Small>
                </div>
                {previewResults.withCosts.results.length > 0 && (
                  <div className="max-h-32 overflow-y-auto">
                    <div className="space-y-1">
                      {previewResults.withCosts.results
                        .slice(0, 10)
                        .map((row, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between text-xs"
                          >
                            <span className="font-mono">
                              {row.provider} - {row.model}
                            </span>
                            <span className="text-muted-foreground">
                              {parseInt(row.count).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      {previewResults.withCosts.results.length > 10 && (
                        <Small className="text-muted-foreground">
                          ... and {previewResults.withCosts.results.length - 10}{" "}
                          more
                        </Small>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            4
          </div>
          <H3>Preview Query</H3>
        </div>
        <P className="text-muted-foreground">
          Generate a preview of the SQL query that will be executed to ensure
          it&apos;s correct.
        </P>

        <div className="mt-4">
          <Button
            onClick={handlePreviewQuery}
            disabled={
              !hasSelections ||
              !isFromDateValid ||
              !isToDateValid ||
              isBackfillingCosts
            }
            variant="outline"
            className="w-full"
          >
            <Eye size={16} className="mr-2" />
            Preview Query
          </Button>
        </div>

        {queryPreview && (
          <div className="mt-4 rounded-md border border-border bg-muted/30">
            <div className="flex items-center gap-2 border-b border-border p-3">
              <Small className="font-medium">Generated SQL Query:</Small>
            </div>
            <div className="p-3">
              <pre className="font-mono overflow-x-auto whitespace-pre-wrap rounded border border-border bg-background p-3 text-xs">
                {queryPreview}
              </pre>
            </div>
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            5
          </div>
          <H3>Execute Backfill</H3>
        </div>

        <div className="mt-4 space-y-4">
          <div className="flex items-center gap-3 rounded-md border border-border bg-card p-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="confirm-toggle"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="h-4 w-4"
              />
              <label htmlFor="confirm-toggle" className="text-sm font-medium">
                I confirm this operation
              </label>
            </div>
          </div>

          {!confirmed && (
            <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 p-3">
              <AlertTriangle size={16} className="text-amber-600" />
              <Small className="text-amber-800">
                Please review the query preview and confirm the operation before
                executing.
              </Small>
            </div>
          )}

          {backfillError && (
            <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3">
              <AlertTriangle
                size={16}
                className="mt-0.5 flex-shrink-0 text-red-600"
              />
              <div className="flex-1">
                <Small className="font-medium text-red-800">
                  Backfill Error:
                </Small>
                <Small className="mt-1 block text-red-700">
                  {backfillError}
                </Small>
              </div>
            </div>
          )}

          <Button
            onClick={handleExecuteQuery}
            disabled={!queryPreview || !confirmed || isBackfillingCosts}
            variant="default"
            className="w-full"
          >
            {isBackfillingCosts ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                Executing Backfill...
              </>
            ) : (
              <>
                <Play size={16} className="mr-2" />
                Execute Cost Backfill
              </>
            )}
          </Button>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            6
          </div>
          <H3>Deduplicate Data</H3>
        </div>
        <P className="text-muted-foreground">
          After backfilling, deduplicate the table to remove any duplicate
          entries. This operation may take some time to complete.
        </P>

        <div>
          <div className="mb-4 flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 p-3">
            <AlertTriangle size={16} className="text-amber-600" />
            <Small className="text-amber-800">
              <strong>Note:</strong> Deduplication is a long-running operation
              that may take several minutes to even hours to complete. If
              backfilling hundreds of thousands of rows, (which may occur for
              popular models), expect to wait a while. The process will continue
              running in the background even after you see the success message.
            </Small>
          </div>

          <Button
            onClick={handleDeduplicate}
            disabled={isDeduplicating}
            variant="secondary"
            className="w-full"
          >
            {isDeduplicating ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
                Deduplicating...
              </>
            ) : (
              <>
                <RefreshCw size={16} className="mr-2" />
                Deduplicate Request Response Table
              </>
            )}
          </Button>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            7
          </div>
          <H3>Verify Results</H3>
        </div>
        <P className="text-muted-foreground">
          After deduplication completes, you can re-run step 3 to verify that
          the backfill was successful and compare the numbers.
        </P>

        <div className="mt-4">
          <Button
            onClick={handleCheckCounts}
            disabled={
              !hasSelections ||
              !isFromDateValid ||
              !isToDateValid ||
              isLoadingPreview
            }
            variant="outline"
            className="w-full"
          >
            {isLoadingPreview ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
                Re-checking Counts...
              </>
            ) : (
              <>
                <BarChart3 size={16} className="mr-2" />
                Re-check Row Counts
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CostBackfiller;
