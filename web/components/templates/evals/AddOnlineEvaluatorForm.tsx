import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { X } from "lucide-react";
import { Plus } from "lucide-react";
import { useGetPropertiesV2 } from "@/services/hooks/propertiesV2";
import { getPropertyFiltersV2 } from "@/services/lib/filters/frontendFilterDefs";
import { useState, useEffect } from "react";
import {
  CommandGroup,
  CommandEmpty,
  CommandInput,
  CommandList,
  CommandItem,
} from "@/components/ui/command";
import { ChevronsUpDown } from "lucide-react";
import { Command } from "@/components/ui/command";
import { DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const AddOnlineEvaluatorForm = ({
  onSubmit,
  isLoading,
  close,
  initialValues,
}: {
  onSubmit: (data: {
    config: {
      sampleRate: number;
      propertyFilters: { key: string; value: string }[];
    };
  }) => void;
  isLoading: boolean;
  close: () => void;
  initialValues?: {
    sampleRate: number;
    propertyFilters: { key: string; value: string }[];
  };
}) => {
  const [sampleRate, setSampleRate] = useState(
    initialValues?.sampleRate || 100
  );
  const [propertyFilters, setPropertyFilters] = useState<
    { key: string; value: string }[]
  >(initialValues?.propertyFilters || []);
  const properties = useGetPropertiesV2(getPropertyFiltersV2);

  // Initialize form with initialValues if provided
  useEffect(() => {
    if (initialValues) {
      setSampleRate(initialValues.sampleRate);
      setPropertyFilters(initialValues.propertyFilters);
    }
  }, [initialValues]);

  const addPropertyFilter = () => {
    setPropertyFilters([...propertyFilters, { key: "", value: "" }]);
  };

  const removePropertyFilter = (index: number) => {
    setPropertyFilters(propertyFilters.filter((_, i) => i !== index));
  };

  const updatePropertyFilter = (index: number, key: string, value: string) => {
    const updatedFilters = [...propertyFilters];
    updatedFilters[index] = { key, value };
    setPropertyFilters(updatedFilters);
  };

  return (
    <>
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-4 w-[300px]" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2 max-w-xl">
            <Label htmlFor="sample-rate" className="flex items-center gap-2">
              Sample Rate:{" "}
              <Input
                type="number"
                value={sampleRate}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  if (value >= 0 && value <= 100) {
                    setSampleRate(value);
                  }
                }}
                className="w-16"
              />
              %
            </Label>
            <Slider
              id="sample-rate"
              min={0.1}
              max={100}
              step={0.1}
              value={[sampleRate]}
              variant="secondary"
              onValueChange={(value) => setSampleRate(value[0])}
            />
          </div>
          <div className="space-y-2">
            <Label>Properties Filters</Label>
            <br />
            <i className="text-xs">
              This uses{" "}
              <a
                href="https://docs.helicone.ai/features/advanced-usage/custom-properties#custom-properties"
                target="_blank"
                className="underline"
                rel="noreferrer"
              >
                custom properties
              </a>{" "}
              to filter which events are sent to the webhook.
            </i>
            <br />

            {propertyFilters.map((filter, index) => (
              <div
                key={index}
                className="grid grid-cols-3 items-center space-x-2"
              >
                <div className="col-span-1">
                  <Popover modal={true}>
                    <PopoverTrigger className="w-full truncate">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between truncate"
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
                            {properties.properties?.map((property) => (
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
                <div className="flex items-center space-x-2 col-span-2">
                  <Input
                    placeholder="Value"
                    value={filter.value}
                    onChange={(e) =>
                      updatePropertyFilter(index, filter.key, e.target.value)
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removePropertyFilter(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <Button variant="outline" onClick={addPropertyFilter}>
              <Plus className="mr-2 h-4 w-4" /> Add Property
            </Button>
          </div>
        </div>
      )}
      <DialogFooter>
        <Button variant="outline" onClick={close}>
          Cancel
        </Button>
        <Button
          onClick={() => onSubmit({ config: { sampleRate, propertyFilters } })}
          disabled={isLoading}
        >
          {initialValues ? "Update" : "Add Evaluator"}
        </Button>
      </DialogFooter>
    </>
  );
};

export default AddOnlineEvaluatorForm;
