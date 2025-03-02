import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useGetPropertiesV2 } from "@/services/hooks/propertiesV2";
import { ChevronsUpDown, Loader2, Plus, X } from "lucide-react";
import { useState } from "react";
import { getPropertyFiltersV2 } from "../../../services/lib/filters/frontendFilterDefs";

interface AddWebhookFormProps {
  onSubmit: (data: {
    destination: string;
    config: {
      sampleRate: number;
      propertyFilters: { key: string; value: string }[];
    };
    includeData: boolean;
  }) => void;
  isLoading: boolean;
}

const AddWebhookForm = (props: AddWebhookFormProps) => {
  const { onSubmit, isLoading } = props;
  const [destination, setDestination] = useState("");
  const [sampleRate, setSampleRate] = useState(100);
  const [includeData, setIncludeData] = useState(true);
  const [propertyFilters, setPropertyFilters] = useState<
    { key: string; value: string }[]
  >([]);
  const properties = useGetPropertiesV2(getPropertyFiltersV2);

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
    <Card className="w-full border-none">
      <CardHeader>
        <CardTitle>Listen to events</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2 max-w-xl">
            <Label htmlFor="webhook-url">Endpoint URL</Label>
            <Input
              type="text"
              id="webhook-url"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="https://"
            />
          </div>
          <div className="space-y-4 max-w-lg">
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
            <div className="flex items-center space-x-2">
              <Switch
                id="include-data"
                checked={includeData}
                onCheckedChange={setIncludeData}
              />
              <Label htmlFor="include-data">Include Enhanced Data</Label>
            </div>
            <p className="text-xs text-muted-foreground ml-7">
              When enabled, webhooks will include additional data such as costs,
              token counts, latency metrics, and S3 URLs for request/response
              bodies.
            </p>
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
                    <PopoverTrigger asChild>
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
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0" sideOffset={4}>
                      <Command>
                        <CommandInput
                          placeholder="Type in anything..."
                          onValueChange={(value) => {
                            updatePropertyFilter(index, value, filter.value);
                          }}
                        />
                        <CommandList>
                          <CommandEmpty>No results found.</CommandEmpty>
                          <CommandGroup heading="Suggestions">
                            {properties.properties?.map((property) => (
                              <CommandItem
                                key={property}
                                onSelect={() =>
                                  updatePropertyFilter(
                                    index,
                                    property,
                                    filter.value
                                  )
                                }
                                value={property}
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
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        <Button variant="outline" onClick={close}>
          Cancel
        </Button>
        <Button
          onClick={() =>
            onSubmit({
              destination,
              config: { sampleRate, propertyFilters },
              includeData,
            })
          }
          disabled={isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Add Webhook
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AddWebhookForm;
