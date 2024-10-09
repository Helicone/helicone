import * as React from "react";
import { CalendarIcon } from "@heroicons/react/20/solid";
import { addDays, format, addHours, differenceInDays } from "date-fns";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProFeature } from "@/hooks/useProFeature";
import { ProFeatureDialog } from "../ProBlockerComponents/ProFeatureDialog";
import { useEffect, useState } from "react";

interface ThemedTimeFilterShadCNProps
  extends React.HTMLAttributes<HTMLDivElement> {
  onDateChange: (date: DateRange | undefined) => void;
  initialDateRange?: DateRange;
}

export function ThemedTimeFilterShadCN({
  className,
  onDateChange,
  initialDateRange,
}: ThemedTimeFilterShadCNProps) {
  const [date, setDate] = useState<DateRange | undefined>(undefined);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { hasAccess } = useProFeature("time_filter");

  useEffect(() => {
    // Set the initial date range after the component mounts
    if (!date) {
      setDate(
        initialDateRange || {
          from: new Date(),
          to: new Date(),
        }
      );
    }
  }, [initialDateRange]);

  const predefinedRanges = [
    {
      label: "1h",
      value: () => ({ from: addHours(new Date(), -1), to: new Date() }),
    },
    {
      label: "3h",
      value: () => ({ from: addHours(new Date(), -3), to: new Date() }),
    },
    {
      label: "12h",
      value: () => ({ from: addHours(new Date(), -12), to: new Date() }),
    },
    {
      label: "1d",
      value: () => ({ from: addDays(new Date(), -1), to: new Date() }),
    },
    {
      label: "3d",
      value: () => ({ from: addDays(new Date(), -3), to: new Date() }),
    },
    {
      label: "7d",
      value: () => ({ from: addDays(new Date(), -7), to: new Date() }),
    },
    {
      label: "30d",
      value: () => ({ from: addDays(new Date(), -30), to: new Date() }),
    },
    {
      label: "90d",
      value: () => ({ from: addDays(new Date(), -90), to: new Date() }),
    },
    {
      label: "1y",
      value: () => ({ from: addDays(new Date(), -365), to: new Date() }),
    },
  ];

  const [customNumber, setCustomNumber] = useState<number>(1);
  const [customUnit, setCustomUnit] = useState<"hour" | "day" | "week">("hour");

  const handleDateChange = (newDate: DateRange | undefined) => {
    if (newDate?.from && newDate?.to) {
      const daysDifference = differenceInDays(newDate.to, newDate.from);
      if (daysDifference > 31 && !hasAccess) {
        setIsDialogOpen(true);
        return;
      }

      setDate(newDate);
      onDateChange(newDate);
    }
  };

  const handleCustomRangeChange = () => {
    const now = new Date();
    let from: Date;

    switch (customUnit) {
      case "hour":
        from = addHours(now, -customNumber);
        break;
      case "day":
        from = addDays(now, -customNumber);
        break;
      case "week":
        from = addDays(now, -customNumber * 7);
        break;
    }

    handleDateChange({ from, to: now });
  };

  const formatDateDisplay = (from: Date, to: Date) => {
    if (from.toDateString() === to.toDateString()) {
      // Same day
      return `${format(from, "LLL d, yyyy")} ${format(
        from,
        "HH:mm"
      )} - ${format(to, "HH:mm")}`;
    } else {
      // Different days
      return `${format(from, "LLL d, yyyy HH:mm")} - ${format(
        to,
        "LLL d, yyyy HH:mm"
      )}`;
    }
  };

  const handlePredefinedRange = (rangeFunc: () => DateRange) => {
    const newRange = rangeFunc();
    handleDateChange(newRange);
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              " dark:text-slate-400",
              "justify-start text-left font-normal"
            )}
            size="md_sleek"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from && date?.to ? (
              formatDateDisplay(date.from, date.to)
            ) : (
              <span>Pick a date and time</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-4 flex flex-col gap-2"
          align="start"
        >
          {/* Predefined ranges */}
          <span className="font-semibold text-sm pt-4">Quick Select:</span>
          <div className="grid gap-2 grid-cols-6">
            {predefinedRanges.map((range) => (
              <Button
                key={range.label}
                variant="outline"
                size="sm_sleek"
                onClick={() => handlePredefinedRange(range.value)}
              >
                {range.label}
              </Button>
            ))}
          </div>

          {/* Custom time range selector */}
          <span className="font-semibold text-sm  pt-4">Custom Range:</span>
          <div className="grid gap-2 ">
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                value={customNumber}
                onChange={(e) => setCustomNumber(parseInt(e.target.value) || 1)}
                className="w-16 px-2 py-1 border rounded text-xs"
              />
              <Select
                value={customUnit}
                onValueChange={(value: "hour" | "day" | "week") =>
                  setCustomUnit(value)
                }
              >
                <SelectTrigger className="w-[100px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hour" className="text-xs">
                    Hour(s)
                  </SelectItem>
                  <SelectItem value="day" className="text-xs">
                    Day(s)
                  </SelectItem>
                  <SelectItem value="week" className="text-xs">
                    Week(s)
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleCustomRangeChange}
                size="sm_sleek"
                variant={"ghost"}
              >
                Apply
              </Button>
            </div>
          </div>

          <span className="font-semibold text-sm pt-4">Date Picker:</span>
          <div className="grid gap-4">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={(newDate) => {
                if (newDate?.from || newDate?.to) {
                  const newDateRange = {
                    from: newDate?.from
                      ? new Date(
                          newDate.from.getFullYear(),
                          newDate.from.getMonth(),
                          newDate.from.getDate(),
                          date?.from?.getHours() ?? 0,
                          date?.from?.getMinutes() ?? 0
                        )
                      : date?.from,
                    to: newDate?.to
                      ? new Date(
                          newDate.to.getFullYear(),
                          newDate.to.getMonth(),
                          newDate.to.getDate(),
                          date?.to?.getHours() ?? 23,
                          date?.to?.getMinutes() ?? 59
                        )
                      : date?.to,
                  };

                  handleDateChange(newDateRange satisfies DateRange);
                }
              }}
              numberOfMonths={2}
              disabled={(date) =>
                date > new Date() || date < new Date("1900-01-01")
              }
              classNames={{
                day_today: "",
              }}
            />
            {/* Time selection inputs */}
            <div className="grid grid-cols-2 items-center gap-2">
              <input
                type="time"
                className="text-xs w-min ml-auto border-gray-300 rounded-md"
                value={date?.from ? format(date.from, "HH:mm") : ""}
                onChange={(e) => {
                  if (date?.from) {
                    const [hours, minutes] = e.target.value.split(":");
                    const newFrom = new Date(date.from);
                    newFrom.setHours(Number(hours), Number(minutes));
                    handleDateChange({ ...date, from: newFrom });
                  }
                }}
              />

              <input
                type="time"
                className="text-xs w-min ml-auto border-gray-300 rounded-md"
                value={date?.to ? format(date.to, "HH:mm") : ""}
                onChange={(e) => {
                  if (date?.to) {
                    const [hours, minutes] = e.target.value.split(":");
                    const newTo = new Date(date.to);
                    newTo.setHours(Number(hours), Number(minutes));
                    handleDateChange({ ...date, to: newTo });
                  }
                }}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
      <ProFeatureDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        featureName="time_filter"
      />
    </div>
  );
}
