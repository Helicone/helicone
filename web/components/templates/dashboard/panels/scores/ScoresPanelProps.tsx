import { TimeIncrement } from "@/lib/timeCalculations/fetchTimeData";
import { FilterNode } from "@/services/lib/filters/filterDefs";
import { TimeFilter } from "@/types/timeFilter";

export interface ScoresPanelProps {
  timeFilter: TimeFilter;
  userFilters: FilterNode;
  dbIncrement: TimeIncrement;
  filterBool?: boolean;
}
