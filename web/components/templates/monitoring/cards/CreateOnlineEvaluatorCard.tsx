import React, { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useGetPropertiesV2 } from "@/services/hooks/propertiesV2";
import { getPropertyFiltersV2 } from "@/services/lib/filters/frontendFilterDefs";
import { Small } from "@/components/ui/typography";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CommandGroup,
  CommandEmpty,
  CommandInput,
  CommandList,
  CommandItem,
} from "@/components/ui/command";
import { Command } from "@/components/ui/command";
import { ChevronsUpDown, Plus, X } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { OnlineEvaluatorConfig } from "../hooks/useOnlineEvaluators";

type SampleType = "sample rate";

type PropertyFilter = {
  key: string;
  value: string;
};

interface OnlineEvaluatorCardProps {
  onSave: (data: { config: OnlineEvaluatorConfig; name: string }) => void;
  isLoading?: boolean;
}

const CreateOnlineEvaluatorCard: React.FC<OnlineEvaluatorCardProps> = ({
  onSave,
  isLoading = false,
}) => {
  const [name, setName] = useState("");
  const [sampleType, setSampleType] = useState<SampleType>("sample rate");
  const [sampleRate, setSampleRate] = useState(100);
  const [propertyFilters, setPropertyFilters] = useState<PropertyFilter[]>([]);

  const properties = useGetPropertiesV2(getPropertyFiltersV2);

  const propertyList = useMemo(
    () => properties.properties || [],
    [properties.properties]
  );

  const addPropertyFilter = useCallback(() => {
    setPropertyFilters((prev) => [...prev, { key: "", value: "" }]);
  }, []);

  const removePropertyFilter = useCallback((index: number) => {
    setPropertyFilters((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updatePropertyFilter = useCallback(
    (index: number, key: string, value: string) => {
      setPropertyFilters((prev) => {
        const updated = [...prev];
        updated[index] = { key, value };
        return updated;
      });
    },
    []
  );

  // Handle save button click
  const handleSave = useCallback(() => {
    // Filter out empty property filters before saving
    const validPropertyFilters = propertyFilters.filter(
      (filter) => filter.key.trim() !== "" && filter.value.trim() !== ""
    );

    onSave({
      config: {
        sampleRate,
        propertyFilters: validPropertyFilters,
      },
      name,
    });
  }, [onSave, name, sampleRate, propertyFilters]);

  const isSaveDisabled = useMemo(
    () => isLoading || !name || !sampleType,
    [isLoading, name, sampleType]
  );

  // Determine if the sample rate section should be shown
  const showSampleRateSection = sampleType === "sample rate";

  return (
    <div className="w-full">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter evaluator name"
              className="focus:ring-2 focus:ring-primary/20"
              aria-required="true"
            />
            {name.trim() === "" && (
              <Small className="text-destructive">Name is required</Small>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="sample-type">Sample Type</Label>
            <Select
              value={sampleType}
              onValueChange={(value) => setSampleType(value as SampleType)}
            >
              <SelectTrigger
                id="sample-type"
                className="focus:ring-2 focus:ring-primary/20"
              >
                <SelectValue placeholder="Select sample type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sample rate">Sample Rate</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {showSampleRateSection && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2 max-w-xl mx-auto w-full">
              <div className="flex items-center gap-2 justify-center">
                <Label
                  htmlFor="sample-rate"
                  className="min-w-[100px] font-medium"
                >
                  Sample Rate:
                </Label>
                <Input
                  id="sample-rate"
                  type="number"
                  value={sampleRate}
                  min={0.1}
                  max={100}
                  step={0.1}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    if (!isNaN(value) && value >= 0 && value <= 100) {
                      setSampleRate(value);
                    }
                  }}
                  className="w-16 focus:ring-2 focus:ring-primary/20"
                  aria-label="Sample rate percentage"
                />
                <span className="text-muted-foreground">%</span>
              </div>
              <Slider
                aria-labelledby="sample-rate"
                min={0.1}
                max={100}
                step={0.1}
                value={[sampleRate]}
                variant="secondary"
                onValueChange={(value) => setSampleRate(value[0])}
                className="mt-2"
              />
              <Small className="text-muted-foreground mt-1 text-center">
                {sampleRate < 100
                  ? `${sampleRate}% of requests will be evaluated`
                  : "All requests will be evaluated"}
              </Small>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-base font-medium">
                  Property Filters
                </Label>
                <Small className="text-muted-foreground text-center">
                  Filter which requests are evaluated based on custom
                  properties.
                  {propertyList.length === 0 && (
                    <span className="block mt-1 text-amber-500 text-center">
                      No properties available. Properties will appear once you
                      start sending custom properties in your requests.
                    </span>
                  )}
                </Small>
              </div>

              <div className="flex flex-col gap-2">
                {propertyFilters.map((filter, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-3 items-center gap-2 p-2 rounded-md bg-muted/30"
                  >
                    <div className="col-span-1">
                      <Popover modal={true}>
                        <PopoverTrigger className="w-full">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                className="w-full justify-between bg-background hover:bg-background/80"
                                aria-label="Select property"
                              >
                                <span className="truncate">
                                  {filter.key || "Select property"}
                                </span>
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {filter.key || "Select property"}
                            </TooltipContent>
                          </Tooltip>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search property..." />
                            <CommandList>
                              <CommandEmpty>No property found.</CommandEmpty>
                              <CommandGroup>
                                {propertyList.map((property) => (
                                  <CommandItem
                                    key={property}
                                    onSelect={() => {
                                      updatePropertyFilter(
                                        index,
                                        property,
                                        filter.value
                                      );
                                    }}
                                  >
                                    {property}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="flex items-center gap-2 col-span-2">
                      <Input
                        placeholder="Value"
                        value={filter.value}
                        onChange={(e) =>
                          updatePropertyFilter(
                            index,
                            filter.key,
                            e.target.value
                          )
                        }
                        className="focus:ring-2 focus:ring-primary/20 bg-background"
                        aria-label={`Value for ${filter.key || "property"}`}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removePropertyFilter(index)}
                        className="hover:bg-destructive/10 hover:text-destructive"
                        aria-label="Remove property filter"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="flex justify-center mt-2">
                  <Button
                    variant="outline"
                    onClick={addPropertyFilter}
                    className="w-fit"
                    aria-label="Add property filter"
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add Property
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-center mt-6">
        <Button
          onClick={handleSave}
          disabled={isSaveDisabled}
          variant="action"
          className="w-2/3"
          aria-label="Save evaluator configuration"
        >
          {isLoading ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
};

export default CreateOnlineEvaluatorCard;
