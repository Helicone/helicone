import React, { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { CalendarIcon, Clock } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface DateTimeInputProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

const DateTimeInput: React.FC<DateTimeInputProps> = ({
  value,
  onValueChange,
  disabled = false,
  className = "",
}) => {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(
    value ? parseISO(value) : undefined
  );

  // Update the date state when value prop changes
  useEffect(() => {
    if (value) {
      try {
        setDate(parseISO(value));
      } catch (e) {
        setDate(undefined);
      }
    } else {
      setDate(undefined);
    }
  }, [value]);

  // Handle date selection from calendar
  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) return;

    // If we already have a date, preserve the time
    const newDate = new Date(selectedDate);
    if (date) {
      newDate.setHours(date.getHours(), date.getMinutes(), date.getSeconds());
    } else {
      // Default to current time if no previous time
      const now = new Date();
      newDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
    }

    setDate(newDate);
    onValueChange(newDate.toISOString());
  };

  // Handle time input changes
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!date) return;

    const [hours, minutes] = e.target.value.split(":");
    const newDate = new Date(date);

    if (hours && minutes) {
      newDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);
      setDate(newDate);
      onValueChange(newDate.toISOString());
    }
  };

  // Format date for display
  const formattedDate = date
    ? `${format(date, "yyyy-MM-dd")} ${format(date, "HH:mm")}`
    : "";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "h-7 justify-start text-[10px] px-3 py-1 font-normal border-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none bg-transparent w-full",
            !date && "text-muted-foreground",
            className
          )}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <CalendarIcon className="mr-2 h-3 w-3" />
              {formattedDate || "Select date & time"}
            </div>
            {date && (
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  setDate(undefined);
                  onValueChange("");
                }}
              >
                <span className="sr-only">Clear</span>
                <span className="text-[10px]">✕</span>
              </Button>
            )}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2 text-[10px]" align="start">
        <div className="space-y-2">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            initialFocus
            className="rounded-md border"
          />
          <div className="flex items-center gap-2 pt-2">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="time"
              value={date ? format(date, "HH:mm") : ""}
              onChange={handleTimeChange}
              className="h-7 text-[10px] border rounded-sm"
              disabled={!date}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default DateTimeInput;
