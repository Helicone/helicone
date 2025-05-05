export interface TimeFilter {
  start: Date;
  end: Date;
}

export interface TimeFilterMs {
  startTimeUnixMs: number;
  endTimeUnixMs: number;
}
