import { Popover, Transition } from "@headlessui/react";
import {
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { addDays, format } from "date-fns";
import { Fragment, useState } from "react";
import { DateRange, DayPicker } from "react-day-picker";

interface DatePickerProps {
  currentRange: DateRange | undefined;
  onTimeFilter: (range: DateRange | undefined) => void;
}

export default function DatePicker(props: DatePickerProps) {
  const { currentRange, onTimeFilter } = props;

  const [range, setRange] = useState<DateRange | undefined>(currentRange);

  return (
    <Popover className="relative">
      <Popover.Button className="text-sm border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white hover:bg-sky-50 flex flex-row items-center gap-2">
        <CalendarDaysIcon className="h-5 w-5 text-gray-900" />
        {range?.from ? (
          range.to ? (
            <>
              {format(range.from, "LLL dd, y")} -{" "}
              {format(range.to, "LLL dd, y")}
            </>
          ) : (
            format(range.from, "LLL dd, y")
          )
        ) : (
          <span>Pick a date</span>
        )}
      </Popover.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-1"
      >
        <Popover.Panel className="absolute mt-2 z-10 bg-white rounded-lg shadow-xl border border-gray-300 p-3">
          {({ close }) => (
            <>
              <DayPicker
                id="test"
                mode="range"
                defaultMonth={addDays(new Date(), -30)}
                selected={range}
                onSelect={setRange}
                numberOfMonths={2}
                showOutsideDays
                components={{
                  IconLeft: ({ ...props }) => (
                    <ChevronLeftIcon className="h-6 w-6 border border-gray-300 rounded-md p-1" />
                  ),
                  IconRight: ({ ...props }) => (
                    <ChevronRightIcon className="h-6 w-6 border border-gray-300 rounded-md p-1" />
                  ),
                }}
                classNames={{
                  months:
                    "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                  month: "space-y-4",
                  caption: "flex justify-center pt-1 relative items-center",
                  caption_label: "text-sm font-medium",
                  nav: "space-x-1 flex items-center",
                  // THIS
                  nav_button:
                    "bg-gray-200 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                  nav_button_previous: "absolute left-1",
                  nav_button_next: "absolute right-1",
                  table: "w-full border-collapse space-y-1",
                  head_row: "flex",
                  head_cell:
                    "text-gray-500 rounded-md w-9 font-normal text-[0.8rem]",
                  row: "flex w-full mt-2",
                  cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-gray-200 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",

                  // THIS
                  day_today: "border border-gray-300",
                  day: "hover:bg-gray-200 rounded-lg h-9 w-9 p-0 font-normal aria-selected:opacity-100",
                  day_range_start: "bg-black text-white",
                  day_range_end: "bg-black text-white",
                  day_selected:
                    "bg-black text-white hover:bg-black hover:text-white focus:bg-black focus:text-white",
                  day_outside: "text-gray-500 opacity-50",
                  day_disabled: "text-gray-500 opacity-50",
                  day_range_middle:
                    "aria-selected:bg-gray-200 aria-selected:text-black",
                  day_hidden: "invisible",
                }}
              />
              <div className="p-3 w-full flex flex-row gap-3 items-center justify-end">
                <button
                  onClick={() => {
                    setRange(currentRange);
                  }}
                  className="items-center rounded-md bg-white border border-gray-300 px-3 py-1.5 text-sm flex font-semibold text-gray-900 shadow-sm hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  Reset
                </button>
                <button
                  onClick={() => {
                    onTimeFilter(range);
                    close();
                  }}
                  className="items-center rounded-md bg-black px-3 py-1.5 text-sm flex font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  Save
                </button>
              </div>
            </>
          )}
        </Popover.Panel>
      </Transition>
    </Popover>
  );
}
