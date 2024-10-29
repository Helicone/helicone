export const examples = [
  {
    page: "EvalsPage",
    jsx: `
 
const EvalsPage = () => {
  const org = useOrg();

  const searchParams = useSearchParams();

  const getInterval = () => {
    const currentTimeFilter = searchParams.get("t");
    if (currentTimeFilter && currentTimeFilter.split("_")[0] === "custom") {
      return "custom";
    } else {
      return currentTimeFilter || "24h";
    }
  };

  const getTimeFilter = () => {
    const currentTimeFilter = searchParams.get("t");
    let range;

    if (currentTimeFilter && currentTimeFilter.split("_")[0] === "custom") {
      const start = currentTimeFilter.split("_")[1]
        ? new Date(currentTimeFilter.split("_")[1])
        : getTimeIntervalAgo("24h");
      const end = new Date(currentTimeFilter.split("_")[2] || new Date());
      range = {
        start,
        end,
      };
    } else {
      range = {
        start: getTimeIntervalAgo((currentTimeFilter as TimeInterval) || "24h"),
        end: new Date(),
      };
    }
    return range;
  };

  const [interval, setInterval] = useState<TimeInterval>(
    getInterval() as TimeInterval
  );
  const [timeFilter, setTimeFilter] = useState(getTimeFilter());

  const [advancedFilters, setAdvancedFilters] = useState<UIFilterRowTree>(
    getRootFilterNode()
  );

  const debouncedAdvancedFilter = useDebounce(advancedFilters, 500);

  const {
    userFilters,
    filterMap,
    properties: { searchPropertyFilters },
  } = useUIFilterConvert(advancedFilters, timeFilter);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["evals", org?.currentOrg?.id, timeFilter, userFilters],
    queryFn: async (query) => {
      const jawn = getJawnClient(org?.currentOrg?.id!);
      const timeFilter = query.queryKey[2] as TimeFilter;
      const filter = query.queryKey[3] as FilterNode;
      return jawn.POST("/v1/evals/query", {
        body: {
          filter: filter as any,
          timeFilter: {
            start: timeFilter.start.toISOString(),
            end: timeFilter.end.toISOString(),
          },
        },
      });
    },
    refetchOnWindowFocus: false,
    keepPreviousData: true,
  });

  const { data: scoreDistributions } = useQuery({
    queryKey: [
      "scoreDistributions",
      org?.currentOrg?.id,
      timeFilter,
      userFilters,
    ],
    queryFn: async (query) => {
      const jawn = getJawnClient(org?.currentOrg?.id!);
      const timeFilter = query.queryKey[2] as TimeFilter;
      const filter = query.queryKey[3] as FilterNode;
      return jawn.POST("/v1/evals/score-distributions/query", {
        body: {
          filter: filter as any,
          timeFilter: {
            start: timeFilter.start.toISOString(),
            end: timeFilter.end.toISOString(),
          },
        },
      });
    },
  });

  const { data: evalScores } = useQuery({
    queryKey: ["evalScores", org?.currentOrg?.id],
    queryFn: async () => {
      const jawn = getJawnClient(org?.currentOrg?.id!);
      return jawn.GET("/v1/evals/scores");
    },
  });

  const evals = data?.data?.data || [];

  const [evalsToShow, setEvalsToShow] = useState<string[]>([]);
  const allEvalScores = evalScores?.data?.data || [];

  const handleSelectAll = () => {
    setEvalsToShow(allEvalScores);
  };

  const handleDeselectAll = () => {
    setEvalsToShow([]);
  };

  const router = useRouter();

  return (
    <>
      <AuthHeader
        title="Evaluators"
        actions={[
          <div key="select-evals" className="flex items-center space-x-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[300px] justify-between">
                  {evalsToShow.length > 0
                    : "Select evals"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0">
                <Command>
                  <CommandInput placeholder="Search evals..." />
                  <CommandEmpty>No eval found.</CommandEmpty>
                  <CommandGroup>
                    {allEvalScores.map((evalScore) => (
                      <CommandItem
                        key={evalScore}
                        onSelect={() => {
                          setEvalsToShow((prev) =>
                            prev.includes(evalScore)
                              ? prev.filter((item) => item !== evalScore)
                              : [...prev, evalScore]
                          );
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            evalsToShow.includes(evalScore)
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        {evalScore}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
            <Button
              variant="link"
              onClick={
                evalsToShow.length > 0 ? handleDeselectAll : handleSelectAll
              }
            >
              {evalsToShow.length > 0 ? "Deselect All" : "Select All"}
            </Button>
          </div>,
        ]}
      />
      <div className="space-y-4">
        {isLoading && <LoadingAnimation />}
        {!isLoading && evals.length === 0 && (
          <div className="flex flex-col w-full mt-12 justify-center items-center">
            <div className="flex flex-col items-center max-w-3xl">
              <ChartBarIcon className="h-12 w-12 text-black dark:text-white" />
              <p className="text-xl text-black dark:text-white font-semibold mt-6">
                No Evals
              </p>
              <p className="text-sm text-gray-500 max-w-sm mt-2 text-center">
                Start adding evals to your requests to see them here.
              </p>
              <div className="mt-6 flex gap-3">
                <Button variant="outline" asChild>
                  <Link href="https://docs.helicone.ai/features/advanced-usage/evals">
                    View Docs
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/requests">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Evals
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}
        <ThemedTable
          advancedFilters={{
            filterMap: filterMap,
            setAdvancedFilters: setAdvancedFilters,
            filters: advancedFilters,
            searchPropertyFilters: searchPropertyFilters,
          }}
          timeFilter={{
            currentTimeFilter: timeFilter,
            defaultValue: "all",
            onTimeSelectHandler: (key: TimeInterval, value: string) => {
              if ((key as string) === "custom") {
                value = value.replace("custom:", "");
                const start = new Date(value.split("_")[0]);
                const end = new Date(value.split("_")[1]);
                setInterval(key);
                setTimeFilter({
                  start,
                  end,
                });
              } else {
                setInterval(key);
                setTimeFilter({
                  start: getTimeIntervalAgo(key),
                  end: new Date(),
                });
              }
            },

          }}
          customButtons={[
            <CreateNewEvaluator
              key="create-new-evaluator"
              onSubmit={() => {}}
            />,
          ]}
          dataLoading={isLoading}
          skeletonLoading={isLoading}
          id="evals-table"
          defaultColumns={INITIAL_COLUMNS}
          defaultData={evals.map((evalRow) => ({
            ...evalRow,
            scoreDistribution:
              scoreDistributions?.data?.data?.find(
                (s) => s.name === evalRow.name
              )?.distribution ?? [],
            type: evalRow.name.includes("-laj-") ? "LLM as a judge" : "Default",
            valueType: evalRow.name.includes("-hcone-bool")
              ? "Boolean"
              : "Numeric",
            id: evalRow.name,
          }))}
        />
      </div>
    </>
  );
};
  `,
  },
  {
    page: "PromptsPage",
    jsx: ` 
        <div className="flex flex-col space-y-4 w-full py-2">
          {isLoading ? (
            <div className="flex flex-col w-full mt-16 justify-center items-center">
              <LoadingAnimation title="Loading Prompts..." />
            </div>
          ) : (
            <>
              {(hasAccess || hasLimitedAccess) && (
                <div
                  id="util"
                  className="flex flex-row justify-between items-center"
                >
                  <div className="flex flex-row items-center space-x-2 w-full">
                tems-center">
                      <div className="w-full">
                        <UpgradeToProCTA
                          defaultPrompts={true}
                          showAddons={true}
                        />
                      </div>
                      <div className="space-x-2 mt-5">
                        <Button variant="outline" asChild>
                          <Link href="https://docs.helicone.ai/features/prompts">
                            View documentation
                          </Link>
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                </div>
              ) : (
                <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
                  <Card className="max-w-4xl">
                    <CardHeader>
                      <CardTitle>Need Prompts?</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        The Free plan does not include the Prompts feature,
                        upgrade to Pro to enable Prompts.
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <InfoBox>
                        <p className="text-sm font-medium">
                          Version prompts, create prompt templates, and run
                          experiments to improve prompt outputs.
                        </p>
                      </InfoBox>
                      <div className="bg-muted p-4 rounded-lg">
                        <div className="flex space-x-2 mb-2">
                          <Button variant="outline" size="sm">
                            Code
                          </Button>
                        </div>

                        <DiffHighlight
                         
                          language="typescript"
                          newLines={[]}
                          oldLines={[]}
                        />
                      </div>
                    </CardContent>
                    <CardFooter className="flex flex-col items-start">
                      <Button
                        variant="link"
                        className="px-0 mb-4"
                        onClick={() =>
                          setShowPricingCompare(!showPricingCompare)
                        }
              ame="w-full">
                        {showPricingCompare && (
                          <PricingCompare featureName="Prompts" />
                        )}
                      </div>
                      <div className="space-x-2 mt-5">
                        <Button variant="outline" asChild>
                          <Link href="https://docs.helicone.ai/features/prompts">

                      </div>
                    </CardFooter>
                  </Card>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </IslandContainer>
  );
};

export default PromptsPage;

`,
  },
  {
    page: "RequestsPage",
    jsx: `
   {unauthorized ? (
          <UnauthorizedView currentTier={currentTier || ""} />
        ) : (
          <div className="flex flex-col h-full overflow-hidden">
            <div
              className={clsx(
                isShiftPressed && "no-select",
                "flex-grow overflow-auto"
              )}
            >
              <ThemedTable
                id="requests-table"
                highlightedIds={
                  selectedData && open ? [selectedData.id] : selectedIds
                }
                showCheckboxes={selectMode}
                defaultData={normalizedRequests}
                defaultColumns={columnsWithProperties}
                skeletonLoading={isDataLoading}
                dataLoading={isBodyLoading}
                sortable={sort}
                advancedFilters={{
                  filterMap: filterMap,
                  filters: advancedFilters,
                  setAdvancedFilters: onSetAdvancedFiltersHandler,
                  searchPropertyFilters: searchPropertyFilters,
                  show: userId ? false : true,
                }}
                savedFilters={
                  organizationLayoutAvailable
                    ? {
                        currentFilter: currFilter ?? undefined,
                        filters:
                          transformedFilters && orgLayout?.data?.id
                            ? transformedFilters
                            : undefined,
                        onFilterChange: onLayoutFilterChange,
                        onSaveFilterCallback: async () => {
                          await orgLayoutRefetch();
                        },
                        layoutPage: "requests",
                      }
                    : undefined
                }
                exportData={normalizedRequests.map((request) => {
                  const flattenedRequest: any = {};
                  Object.entries(request).forEach(([key, value]) => {
                    // key is properties and value is not null
                    if (
                      key === "customProperties" &&
                      value !== null &&
                      value !== undefined
                    ) {
                      Object.entries(value).forEach(([key, value]) => {
                        if (value !== null) {
                          flattenedRequest[key] = value;
                        }
                      });
                    } else {
                      flattenedRequest[key] = value;
                    }
                  });
                  return flattenedRequest;
                })}
                timeFilter={{
                  currentTimeFilter: timeRange,
                  defaultValue: "1m",
                  onTimeSelectHandler: onTimeSelectHandler,
                }}
                onRowSelect={(row, index) => {
                  onRowSelectHandler(row, index);
                }}
                makeCard={
                  userId
                    ? undefined
                    : (row) => {
                        return (
                          <RequestCard request={row} properties={properties} />
                        );
                      }
                }
                makeRow={
                  userId
                    ? undefined
                    : {
                        properties: properties,
                      }
                }
                customButtons={[
                  <div key={"dataset-button"}>
                    <DatasetButton
                      datasetMode={selectMode}
                      setDatasetMode={toggleSelectMode}
                      items={[]}
                      onAddToDataset={() => {}}
                      renderModal={undefined}
                    />
                  </div>,
                ]}
                onSelectAll={selectAll}
                selectedIds={selectedIds}
                rightPanel={
                  open ? (
                    <RequestDiv
                      open={open}
                      setOpen={setOpen}
                      request={selectedData}
                      properties={properties}
                      hasPrevious={
                        selectedDataIndex !== undefined && selectedDataIndex > 0
                      }
                      hasNext={
                        selectedDataIndex !== undefined &&
                        selectedDataIndex < normalizedRequests.length - 1
                      }
                      onPrevHandler={() => {
                        if (
                          selectedDataIndex !== undefined &&
                          selectedDataIndex > 0
                        ) {
                          setSelectedDataIndex(selectedDataIndex - 1);
                          setSelectedData(
                            normalizedRequests[selectedDataIndex - 1]
                          );
                          searchParams.set(
                            "requestId",
                            normalizedRequests[selectedDataIndex - 1].id
                          );
                        }
                      }}
                      onNextHandler={() => {
                        if (
                          selectedDataIndex !== undefined &&
                          selectedDataIndex < normalizedRequests.length - 1
                        ) {
                          setSelectedDataIndex(selectedDataIndex + 1);
                          setSelectedData(
                            normalizedRequests[selectedDataIndex + 1]
                          );
                          searchParams.set(
                            "requestId",
                            normalizedRequests[selectedDataIndex + 1].id
                          );
                        }
                      }}
                    />
                  ) : undefined
                }
              >
                {selectMode && (
                  <Row className="gap-5 items-center w-full justify-between bg-white dark:bg-black p-5">
                    <div className="flex flex-row gap-2 items-center">
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        Request Selection:
                      </span>
                      <span className="text-sm p-2 rounded-md font-medium bg-[#F1F5F9] dark:bg-slate-900 text-[#1876D2] dark:text-slate-100 whitespace-nowrap">
                        {selectedIds.length} selected
                      </span>
                    </div>
                    {selectedIds.length > 0 && (
                      <ProFeatureWrapper featureName="Datasets">
                        <GenericButton
                          onClick={() => {
                            setModalOpen(true);
                          }}
                          icon={
                            <PlusIcon className="h-5 w-5 text-slate-900 dark:text-slate-100" />
                          }
                          text="Add to dataset"
                        />
                      </ProFeatureWrapper>
                    )}
                  </Row>
                )}
              </ThemedTable>
            </div>

            <div className="bg-white dark:bg-black border-t border-slate-200 dark:border-slate-700 py-2 flex-shrink-0 w-full">
              <TableFooter
                currentPage={page}
                pageSize={pageSize}
                isCountLoading={isCountLoading}
                count={count || 0}
                onPageChange={(n) => handlePageChange(n)}
                onPageSizeChange={(n) => setCurrentPageSize(n)}
                pageSizeOptions={[25, 50, 100, 250, 500]}
              />
            </div>
          </div>
        )}
      </div>

      <ThemedModal open={modalOpen} setOpen={setModalOpen}>
        <NewDataset
          request_ids={selectedIds}
          onComplete={() => {
            setModalOpen(false);
            toggleSelectMode(false);
          }}
        />
      </ThemedModal>
    `,
  },
  {
    page: "TreeView",
    jsx: `
    <>
      <Col className="h-full">
        <Col className="gap-1 items-start sticky top-0 z-[100]">
          {showSpan && (
            <div className="bg-white w-full relative dark:bg-slate-900 border-slate-200 border-t">
              <TraceSpan
                session={session}
                selectedRequestIdDispatch={[
                  selectedRequestId,
                  setSelectedRequestId,
                ]}
                height={expandSpan ? "100%" : "200px"}
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-3 right-3 border border-slate-200 hover:bg-slate-50 active:bg-slate-100 p-2 dark:border-slate-700 dark:hover:bg-slate-700 dark:active:bg-slate-800"
                onClick={() => setExpandSpan(!expandSpan)}
              >
                {expandSpan ? (
                  <ShrinkIcon
                    width={16}
                    height={16}
                    className="text-slate-900 dark:text-slate-200"
                  />
                ) : (
                  <ExpandIcon
                    width={16}
                    height={16}
                    className="text-slate-900 dark:text-slate-200"
                  />
                )}
              </Button>
            </div>
          )}
        </Col>
        <Row
          className={
            "bg-slate-50 dark:bg-black border-t border-r border-b border-slate-200 dark:border-slate-700 border-collapse overflow-x-auto"
          }
        >
          <div className="flex-shrink-0 w-[30em]">
            <ScrollArea className="h-full">
              <Col className="border-r border-slate-200 dark:border-slate-700 pb-10">
                <div className="w-full bg-slate-50 dark:bg-black flex justify-end h-10">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          className="rounded-none"
                          variant="ghost"
                          size="icon"
                          onClick={() => setCollapseAll(!collapseAll)}
                        >
                          {collapseAll ? (
                            <ChevronsUpDownIcon width={16} height={16} />
                          ) : (
                            <ChevronsDownUpIcon width={16} height={16} />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Collapse All</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Tree
                  data={tracesToTreeNodeData(session.traces)}
                  className="min-h-[1000px] max-h-screen"
                  selectedRequestIdDispatch={[
                    selectedRequestId,
                    setSelectedRequestId,
                  ]}
                  collapseAll={collapseAll}
                  setShowDrawer={setShowDrawer}
                />
              </Col>
            </ScrollArea>
          </div>
          <ScrollArea className="h-full w-fit bg-white">
            <div className="flex flex-col gap-5 w-full">
              <div className="flex-grow [&_.border]:border-none">
                {requestIdToShow &&
                  requests.requests.requests?.find(
                    (r) => r.request_id === requestIdToShow
                  ) && (
                    <>
                      {getNormalizedRequest(
                        requests.requests.requests?.find(
                          (r) => r.request_id === requestIdToShow
                        )!
                      ).render()}
                    </>
                  )}
              </div>
            </div>
          </ScrollArea>
        </Row>
      </Col>
      {showDrawer && requestIdToShow && (
        <RequestDrawerV2
          open={showDrawer}
          setOpen={setShowDrawer}
          request={getNormalizedRequest(
            requests.requests.requests?.find(
              (r) => r.request_id === requestIdToShow
            )!
          )}
          properties={[]}
        />
      )}
    </>
  );
};

export default TreeView;

    `,
  },
  {
    page: "WebhooksPage",
    jsx: `
nfig,
        },
      });
    },
    onSuccess: () => {
      setNotification("Webhook created!", "success");
      refetchWebhooks();
    },
  })> ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setNotification("Copied to clipboard!", "success");
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-4 w-[300px]" />
        </div>
      );
    }

    if (!webhooks?.data?.data || webhooks.data.data.length === 0) {
      return (
        <div className="flex flex-col w-full h-96 justify-center items-center">
          <Card className="w-full max-w-md">
            <CardContent className="flex flex-col items-center pt-6 space-y-4">
              <PiWebhooksLogo className="h-12 w-12 text-primary mb-4" />
              <CardTitle className="text-xl mb-2">
                No Webhooks Created
              </CardTitle>
              <p className="text-sm text-muted-foreground text-center">
                Create a webhook to start receiving real-time updates
              </p>
              <Dialog open={addWebhookOpen} onOpenChange={setAddWebhookOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="max-w-fit ml-2"
                  >
                    <PlusIcon className="h-5 w-5 mr-1" />
                    Add Webhook
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl w-full">
                  <AddWebhookForm
                    onSubmit={(data) => {
                      createWebhook.mutate({
                        destination: data.destination,
                        config: data.config,
                      });
                      setAddWebhookOpen(false);
                    }}
                    isLoading={createWebhook.isLoading}
                  />
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <Table className="w-full bg-white border">
        <TableHeader>
          <TableRow>
            <TableHead>Destination</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Version</TableHead>
            <TableHead>Sample Rate</TableHead>
            <TableHead>Property Filters</TableHead>
            <TableHead>HMAC Key</TableHead>

            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {webhooks?.data?.data?.map((webhook) => (
            <TableRow key={webhook.id}>
              <TableCell>{webhook.destination}</TableCell>

              <TableCell>{getUSDateFromString(webhook.created_at!)}</TableCell>
              <TableCell>{webhook.version}</TableCell>
              <TableCell>
                {(webhook.config as any)?.["sampleRate"] ?? 100}%
              </TableCell>
              <TableCell>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      {
                        (
                          ((webhook.config as any)?.propertyFilters ?? []) as {
                            key: string;
                            value: string;
                          }[]
                        ).length
                      }
                    </TooltipTrigger>
                    <TooltipContent>
                      <ul className="list-disc pl-4">
                        {(
                          ((webhook.config as any)?.propertyFilters ?? []) as {
                            key: string;
                            value: string;
                          }[]
                        ).map((filter, index) => (
                          <li key={index}>
                            {filter.key}: {filter.value}
                          </li>
                        ))}
                      </ul>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  {visibleHmacKeys[webhook.id] ? (
                    <>
                      <span>{webhook.hmac_key}</span>
                      <button onClick={() => toggleHmacVisibility(webhook.id)}>
                        <EyeSlashIcon className="h-5 w-5 text-gray-500" />
                      </button>
                    </>
                  ) : (
                    <>
                      <span>••••••••</span>
                      <button onClick={() => toggleHmacVisibility(webhook.id)}>
                        <EyeIcon className="h-5 w-5 text-gray-500" />
                      </button>
                    </>
                  )}
                  <button onClick={() => copyToClipboard(webhook.hmac_key)}>
                    <ClipboardIcon className="h-5 w-5 text-gray-500" />
                  </button>
                </div>
              </TableCell>

              <TableCell>
                <Button
                  variant="destructive"
                  size="sm"
                  className="ml-2"
                  onClick={() => {
                    deleteWebhook.mutate(webhook.id);
                  }}
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  if (!org?.currentOrg?.tier) {
    return null;
  }

  if (
    org?.currentOrg?.tier !== "enterprise" &&
    org?.currentOrg?.tier !== "pro-20240913"
  ) {
    return (
      <div className="flex flex-col space-y-8 items-center min-h-[calc(100vh-200px)]">
        <InfoBox variant="warning" className="mb-4 max-w-xl">
          Webhooks are currently in beta. And are only available for Pro plans.
          If you have any issues, please contact us at support@helicone.ai.
        </InfoBox>
        <FeatureUpgradeCard
          title="Unlock Webhooks"
          description="The Free plan does not include the BETA webhooks feature, but getting access is easy."
          infoBoxText="Add webhooks to easily subscribe to API requests that come into Helicone."
          documentationLink="https://docs.helicone.ai/features/sessions"
        />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col space-y-2">
        <AuthHeader
          isWithinIsland={true}
          title={<div className="flex items-center gap-2 ml-8">Webhooks</div>}
        />

        <div className="ml-8 mb-4">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground transition-colors"
            asChild
          >
            <a
              href="https://docs.helicone.ai/features/webhooks"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1"
            >
              Learn more about Helicone webhooks
              <ExternalLinkIcon className="h-4 w-4" />
            </a>
          </Button>
        </div>

        {renderContent()}

        <Dialog open={addWebhookOpen} onOpenChange={setAddWebhookOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="max-w-fit ml-2">
              <PlusIcon className="h-5 w-5 mr-1" />
              Add Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl w-full">
            <AddWebhookForm
              onSubmit={(data) => {
                createWebhook.mutate({
                  destination: data.destination,
                  config: data.config,
                });
                setAddWebhookOpen(false);
              }}
              isLoading={createWebhook.isLoading}
            />
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default WebhooksPage;

    `,
  },
  {
    page: "OrgDropdown",
    jsx: `
  <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
          
                />
              )}
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  {orgContext?.currentOrg?.name}
                </h3>
                <p className="text-xs text-slate-500 font-medium max-w-[10rem] truncate">
                  {user?.email}
                </p>
              </div>
            </div>
            <div className="hidden sm:block">
              <OrgMoreDropdown
                ownedOrgs={ownedOrgs}
                memberOrgs={memberOrgs}
                customerOrgs={customerOrgs}
                createNewOrgHandler={createNewOrgHandler}
                currentOrgId={orgContext?.currentOrg?.id}
                setCurrentOrg={orgContext?.setCurrentOrg}
              />
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="block sm:hidden">
            <OrgMoreDropdown
              ownedOrgs={ownedOrgs}
              memberOrgs={memberOrgs}
              customerOrgs={customerOrgs}
              createNewOrgHandler={createNewOrgHandler}
              currentOrgId={orgContext?.currentOrg?.id}
              setCurrentOrg={orgContext?.setCurrentOrg}
            />
            <DropdownMenuSeparator />
          </div>
          <DropdownMenuGroup>
            <DropdownMenuItem asChild className="cursor-pointer text-xs">
              <Link href="/settings/members">Invite members</Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              className={cn("hover:bg-transparent cursor-default")}
              disableHover
              disableClickClose
            >
              <div className="flex items-center justify-between w-full text-xs">
                <span>Dark mode</span>
                <Switch
                  checked={theme === "dark"}
                  onCheckedChange={handleThemeChange}
                  size="md"
                />
              </div>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />

          <Link href="/settings" rel="noopener noreferrer">
            <DropdownMenuItem className="text-xs">
              <Cog6ToothIcon className="h-4 w-4 mr-2" />
              Settings
            </DropdownMenuItem>
          </Link>
          <DropdownMenuItem onSelect={handleSignOut} className="text-xs">
            <LogOutIcon className="h-4 w-4 mr-2" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <CreateOrgForm onCancelHandler={setCreateOpen} />
        </DialogContent>
      </Dialog>

      <AddMemberModal
        orgId={org?.currentOrg?.id || ""}
        orgOwnerId={org?.currentOrg?.owner || ""}
        open={addOpen}
        setOpen={setAddOpen}
      />
    </>
    `,
  },
  {
    page: "PricingPage",
    jsx: `
<div className="bg-[#f8feff]">

              width={200}
              height={100}
            />
          </span>

          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight max-w-4xl pt-8">
            Pricing that&apos;s <span className=" text-sky-500">simple</span>
          </h1>
          <p className="mt-4 w-full text-md sm:text-lg leading-7 text-gray-700 max-w-xl">
            Only pay for what you use. We offer{" "}
            <Link
              className="underline underline-offset-4 decoration-sky-300"
              // navigate to the pricing section
              href="#pricing"
            >
              usage-based pricing
            </Link>{" "}
            that scales with your business when you need it.
          </p>
          <div className="flex items-center gap-4 pt-4">
            <Link
              href="/contact"
              className="bg-white hover:bg-gray-100 ease-in-out duration-500 text-black border-[3px] border-gray-300 rounded-lg px-4 py-2 text-sm font-bold shadow-lg flex w-fit items-center gap-1"
            >
              Get a demo
            </Link>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 py-16">
            {/* map over an array of 3 */}
            {TIERS.map((tier, index) => (
              <div
                key={tier.name}
                className="w-full h-full border border-gray-300 rounded-xl flex flex-col space-y-4 p-8 bg-white"
              >
                <h2 className="text-sm font-semibold">{tier.name}</h2>
                <div className="flex items-baseline space-x-1">
                  {tier.name === "Free" && (
                    <>
                      <p className="text-3xl font-semibold">$0.00</p>
                      <p className="text-sm text-gray-500">/month</p>
                    </>
                  )}
                  {tier.name === "Growth" && (
                    <>
                      <p className="text-3xl font-semibold">
                        {renderLogCost()}
                      </p>
                      <p className="text-sm text-gray-500">/month</p>
                    </>
                  )}
                  {tier.name === "Enterprise" && (
                    <>
                      <p className="text-3xl font-semibold">Get in touch</p>
                    </>
                  )}
                </div>
                {tier.name === "Free" && (
                  <div className="h-32 border-t border-b border-gray-100 flex items-center w-full justify-center">
                    <p className="text-center font-medium text-gray-500 px-4">
                      Free for up to 100k requests per month
                    </p>
                  </div>
                )}
                {tier.name === "Growth" && (
                  <div className="h-32 border-t border-b border-gray-100 flex items-center w-full">
                    <div className="py-4 w-full">
                      <p className="text-xs text-black font-semibold">
                        {new Intl.NumberFormat("us", {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format(requestLogs)}
                        <span className="text-gray-500 font-normal">
                          {" "}
                          requests / month
                        </span>
                      </p>
                      <Slider
                        min={0}
                        max={50_000_000}
                        exponent={3}
                        onChange={handleRequestLogChange}
                        labels={{
                          0: "0",
                          100_000: "100k",
                          1_000_000: "1m",
                          10_000_000: "10m",
                          50_000_000: "50m",
                        }}
                      />
                    </div>
                  </div>
                )}
                {tier.name === "Enterprise" && (
                  <div className="h-32 border-t border-b border-gray-100 flex items-center w-full justify-center">
                    <p className="text-center font-medium text-gray-500 px-4">
                      Contact us for a tailored plan for your business
                    </p>
                  </div>
                )}

                <ul className="text-gray-500 text-sm">
                  {tier.features.map((feature) => (
                    <li
                      className="flex items-center gap-4 py-2"
                      key={feature.name}
                    >
                      {feature.included === true ? (
                        <CheckCircleIcon className="h-5 w-5 text-sky-500" />
                      ) : (
                        <XCircleIcon className="h-5 w-5 text-gray-300" />
           
                <HcButton
                  variant={index === 1 ? "primary" : "secondary"}
                  size={"sm"}
                  title={tier.ctaCopy}
                  onClick={() => {
                    router.push(tier.href);
                  }}
                />
              </div>
            ))}
          </div>
          <div className="flex flex-col max-w-6xl mx-auto space-y-8 py-4">
            <HcButton
              variant="light"
              size="lg"
              title="Compare Plans"
              icon={!showPlans ? ChevronDownIcon : ChevronUpIcon}
              onClick={() => {
                setShowPlans(!showPlans);
              }}
            />
            {showPlans && <FeatureTable />}
          </div>
          <div className="flex flex-col max-w-6xl mx-auto space-y-8 py-16 w-full">
            <h2 className="text-lg sm:text-2xl font-bold tracking-tight max-w-4xl pt-8">
              Available <span className=" text-sky-500">discounts</span>
            </h2>
            <ul className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <li className="flex items-start gap-4 col-span-1 w-full">
                <div>
                  <HomeModernIcon className="h-6 w-6 text-purple-500" />
                </div>
                <div className="flex flex-col space-y-1">
                  <h3 className="text-black font-semibold">Startups</h3>
                  <p className="text-gray-700 text-sm">
                    For most startups under two years old and non-profits, we
                    offer 50% off for the first year.
                  </p>
                </div>
              </li>{" "}
              <li className="flex items-start gap-4 col-span-1 w-full">
                <div>
                  <HomeModernIcon className="h-6 w-6 text-purple-500" />
                </div>
                <div className="flex flex-col space-y-1">
                  <h3 className="text-black font-semibold">Non-Profits</h3>
                  <p className="text-gray-700 text-sm">
                    For most non-profits, we offer large discounts depending on
                    organization size.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-4 col-span-1 w-full">
                <div>
                  <CodeBracketIcon className="h-6 w-6 text-green-500" />
                </div>
                <div className="flex flex-col space-y-1">
                  <h3 className="text-black font-semibold">
                    Open-Source Companies
                  </h3>
                  <p className="text-gray-700 text-sm">
                    For fellow open-source companies, we offer a $5,000 credit
                    for the first year.
                  </p>
                </div>
              </li>{" "}
              <li className="flex items-start gap-4 col-span-1 w-full">
                <div>
                  <AcademicCapIcon className="h-6 w-6 text-black" />
                </div>
                <div className="flex flex-col space-y-1">
                  <h3 className="text-black font-semibold">Students</h3>
                  <p className="text-gray-700 text-sm">
                    For most students and educators, we provide Helicone free of
                    charge.
                  </p>
                </div>
              </li>{" "}
            </ul>
            <div className="flex items-center justify-center">
              <HcButton
                variant="secondary"
                size="md"
                title="Get in touch"
                onClick={() => {
                  router.push("/contact");
                }}
              />
            </div>
          </div>
        </div>
    `,
  },
  {
    page: "CachePage",
    jsx: `
          language="typescript"
                    newLines={[]}
                    oldLines={[]}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col">
          <Tabs defaultValue={defaultIndex} className="w-full">
            <TabsList className="font-semibold">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id.toString()}
                  onClick={() => {
                    router.push(
                      {
                        query: { ...router.query, tab: tab.id },
                      },
                      undefined,
                      { shallow: true }
                    );
                  }}
                >
                  <tab.icon className="h-5 w-5 mr-2" />
                  {tab.title}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value="0">
              <div className="flex flex-col xl:flex-row gap-4 w-full py-4">
                <div className="flex flex-col space-y-4 w-full xl:w-1/2">
                  <ul className="flex flex-col sm:flex-row items-center gap-4 w-full">
                    {metrics.map((metric, i) => (
                      <li
                        key={i}
                        className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-black p-4 flex flex-row rounded-lg items-center gap-4"
                      >
                        <metric.icon className="h-6 w-6 text-sky-500" />
                        <div className="flex flex-col">
                          <dt className="text-gray-500 text-sm">
                            {metric.label}
                          </dt>
                          {metric.isLoading ? (
                            <div className="animate-pulse h-7 w-24 bg-gray-200 dark:bg-gray-800 rounded-lg" />
                          ) : (
                            <dd className="text-gray-900 dark:text-gray-100 text-xl font-semibold">
                              {metric.value}
                            </dd>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-col space-y-4 py-6 bg-white dark:bg-black border border-gray-300 dark:border-gray-700 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 text-center">
                      Caches last 30 days
                    </h3>
                    <div className="h-72 px-4 ">
                      {isAnyLoading ? (
                        <div className="h-full w-full flex-col flex p-8">
                          <div className="h-full w-full rounded-lg bg-gray-300 dark:bg-gray-700 animate-pulse" />
                        </div>
                      ) : (
                        <div className="h-full w-full">
                          <BarChart
                            data={chartData}
                            categories={["count"]}
                            index={"date"}
                            className="h-full -ml-4 pt-4"
                            colors={["blue"]}
                            showLegend={false}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div
                  className="flex flex-col w-full xl:w-1/2
space-y-4 py-6 bg-white dark:bg-black border border-gray-300 dark:border-gray-700 rounded-lg h-[30rem]"
                >
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 text-center">
                    Top Requests
                  </h3>
                  <ul
                  </ul>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="1">
              <div className="py-4">
                <RequestsPageV2
                  currentPage={currentPage}
                  pageSize={pageSize}
                  sort={sort}
                  isCached={true}
                  currentFilter={null}
                  organizationLayout={null}
                  organizationLayoutAvailable={false}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}

      <ThemedDrawer open={open} setOpen={setOpen}>
        <div className="flex flex-col space-y-2">
          <p className="text-gray-500 text-sm border p-2 rounded-lg border-red-300 dark:border-red-700">
            Cache Bucket response configurable soon...
          </p>
          <dl className="mt-2 grid grid-cols-2">
            <div className="col-span-2 flex flex-row justify-between py-2 items-center text-sm font-medium border-b border-gray-200 dark:border-gray-800">
              <div className="flex flex-col">
                <dt className="text-gray-500">Request ID</dt>
                <dd className="text-gray-900 dark:text-gray-100">
                  {selectedRequest?.request_id}
                </dd>
              </div>
            </div>
            <div className="flex flex-col justify-between py-2 text-sm font-medium col-span-1 border-b border-gray-200 dark:border-gray-800">
              <dt className="text-gray-500">Model</dt>
              <dd className="text-gray-900 dark:text-gray-100">
                <ModelPill model={selectedRequest?.model ?? ""} />
              </dd>
            </div>
            <div className="flex flex-col justify-between py-2 text-sm font-medium col-span-1 border-b border-gray-200 dark:border-gray-800">
              <dt className="text-gray-500">Cache Hits</dt>
              <dd className="text-gray-900 dark:text-gray-100">
                {selectedRequest?.count}
              </dd>
            </div>
            <div className="flex flex-col justify-between py-2 text-sm font-medium col-span-1 border-b border-gray-200 dark:border-gray-800">
              <dt className="text-gray-500">First Used</dt>
              <dd className="text-gray-900 dark:text-gray-100">
                {new Date(selectedRequest?.first_used || "").toLocaleString()}
              </dd>
            </div>
            <div className="flex flex-col justify-between py-2 text-sm font-medium col-span-1 border-b border-gray-200 dark:border-gray-800">
              <dt className="text-gray-500">Last Used</dt>
              <dd className="text-gray-900 dark:text-gray-100">
                {new Date(selectedRequest?.last_used || "").toLocaleString()}
              </dd>
            </div>
          </dl>
          <div className="w-full flex flex-col text-left space-y-1 mb-4 pt-8">
            <p className="text-gray-500 text-sm font-medium">Request</p>
            <p className="text-gray-900 dark:text-gray-100 p-2 border border-gray-300 bg-gray-100 dark:border-gray-700 dark:bg-gray-900 rounded-md whitespace-pre-wrap h-full leading-6 overflow-auto">
              {selectedRequest?.prompt || "n/a"}
            </p>
          </div>
        </div>
      </ThemedDrawer>
      <UpgradeProModal open={openUpgradeModal} setOpen={setOpenUpgradeModal} />
    </IslandContainer>
  ); 
    `,
  },
  {
    page: "AlertPage",
    jsx: `
          language="typescript"
                    newLines={[]}
                    oldLines={[]}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col">
          <Tabs defaultValue={defaultIndex} className="w-full">
            <TabsList className="font-semibold">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id.toString()}
                  onClick={() => {
                    router.push(
                      {
                        query: { ...router.query, tab: tab.id },
                      },
                      undefined,
                      { shallow: true }
                    );
                  }}
                >
                  <tab.icon className="h-5 w-5 mr-2" />
                  {tab.title}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value="0">
              <div className="flex flex-col xl:flex-row gap-4 w-full py-4">
                <div className="flex flex-col space-y-4 w-full xl:w-1/2">
                  <ul className="flex flex-col sm:flex-row items-center gap-4 w-full">
                    {metrics.map((metric, i) => (
                      <li
                        key={i}
                        className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-black p-4 flex flex-row rounded-lg items-center gap-4"
                      >
                        <metric.icon className="h-6 w-6 text-sky-500" />
                        <div className="flex flex-col">
                          <dt className="text-gray-500 text-sm">
                            {metric.label}
                          </dt>
                          {metric.isLoading ? (
                            <div className="animate-pulse h-7 w-24 bg-gray-200 dark:bg-gray-800 rounded-lg" />
                          ) : (
                            <dd className="text-gray-900 dark:text-gray-100 text-xl font-semibold">
                              {metric.value}
                            </dd>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-col space-y-4 py-6 bg-white dark:bg-black border border-gray-300 dark:border-gray-700 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 text-center">
                      Caches last 30 days
                    </h3>
                    <div className="h-72 px-4 ">
                      {isAnyLoading ? (
                        <div className="h-full w-full flex-col flex p-8">
                          <div className="h-full w-full rounded-lg bg-gray-300 dark:bg-gray-700 animate-pulse" />
                        </div>
                      ) : (
                        <div className="h-full w-full">
                          <BarChart
                            data={chartData}
                            categories={["count"]}
                            index={"date"}
                            className="h-full -ml-4 pt-4"
                            colors={["blue"]}
                            showLegend={false}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div
                  className="flex flex-col w-full xl:w-1/2
space-y-4 py-6 bg-white dark:bg-black border border-gray-300 dark:border-gray-700 rounded-lg h-[30rem]"
                >
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 text-center">
                    Top Requests
                  </h3>
                  <ul
                  </ul>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="1">
              <div className="py-4">
                <RequestsPageV2
                  currentPage={currentPage}
                  pageSize={pageSize}
                  sort={sort}
                  isCached={true}
                  currentFilter={null}
                  organizationLayout={null}
                  organizationLayoutAvailable={false}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}

      <ThemedDrawer open={open} setOpen={setOpen}>
        <div className="flex flex-col space-y-2">
          <p className="text-gray-500 text-sm border p-2 rounded-lg border-red-300 dark:border-red-700">
            Cache Bucket response configurable soon...
          </p>
          <dl className="mt-2 grid grid-cols-2">
            <div className="col-span-2 flex flex-row justify-between py-2 items-center text-sm font-medium border-b border-gray-200 dark:border-gray-800">
              <div className="flex flex-col">
                <dt className="text-gray-500">Request ID</dt>
                <dd className="text-gray-900 dark:text-gray-100">
                  {selectedRequest?.request_id}
                </dd>
              </div>
            </div>
            <div className="flex flex-col justify-between py-2 text-sm font-medium col-span-1 border-b border-gray-200 dark:border-gray-800">
              <dt className="text-gray-500">Model</dt>
              <dd className="text-gray-900 dark:text-gray-100">
                <ModelPill model={selectedRequest?.model ?? ""} />
              </dd>
            </div>
            <div className="flex flex-col justify-between py-2 text-sm font-medium col-span-1 border-b border-gray-200 dark:border-gray-800">
              <dt className="text-gray-500">Cache Hits</dt>
              <dd className="text-gray-900 dark:text-gray-100">
                {selectedRequest?.count}
              </dd>
            </div>
            <div className="flex flex-col justify-between py-2 text-sm font-medium col-span-1 border-b border-gray-200 dark:border-gray-800">
              <dt className="text-gray-500">First Used</dt>
              <dd className="text-gray-900 dark:text-gray-100">
                {new Date(selectedRequest?.first_used || "").toLocaleString()}
              </dd>
            </div>
            <div className="flex flex-col justify-between py-2 text-sm font-medium col-span-1 border-b border-gray-200 dark:border-gray-800">
              <dt className="text-gray-500">Last Used</dt>
              <dd className="text-gray-900 dark:text-gray-100">
                {new Date(selectedRequest?.last_used || "").toLocaleString()}
              </dd>
            </div>
          </dl>
          <div className="w-full flex flex-col text-left space-y-1 mb-4 pt-8">
            <p className="text-gray-500 text-sm font-medium">Request</p>
            <p className="text-gray-900 dark:text-gray-100 p-2 border border-gray-300 bg-gray-100 dark:border-gray-700 dark:bg-gray-900 rounded-md whitespace-pre-wrap h-full leading-6 overflow-auto">
              {selectedRequest?.prompt || "n/a"}
            </p>
          </div>
        </div>
      </ThemedDrawer>
      <UpgradeProModal open={openUpgradeModal} setOpen={setOpenUpgradeModal} />
    </IslandContainer>
  ); 
    `,
  },
  {
    page: "SettingsPage",
    jsx: `
   <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              href={tab.href}
     
            >
              <tab.icon
               
              />
              {tab.title}
            </Link>
          ))}
        </nav>
      </div>
    `,
  },
];
