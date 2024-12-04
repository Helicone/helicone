import ReactGridLayout from "react-grid-layout";

export const INITIAL_LAYOUT: ReactGridLayout.Layout[] = [
  {
    i: "requests-count-distribution",
    x: 0,
    y: 0,
    w: 4,
    h: 4,
  },
  {
    i: "cost-distribution",
    x: 4,
    y: 0,
    w: 4,
    h: 4,
  },
  {
    i: "duration-distribution",
    x: 8,
    y: 0,
    w: 4,
    h: 4,
  },
];

export const MD_LAYOUT: ReactGridLayout.Layout[] = [
  {
    i: "requests-count-distribution",
    x: 0,
    y: 0,
    w: 6,
    h: 4,
  },
  {
    i: "cost-distribution",
    x: 6,
    y: 0,
    w: 6,
    h: 4,
  },
  {
    i: "duration-distribution",
    x: 0,
    y: 4,
    w: 12,
    h: 4,
  },
];

export const SMALL_LAYOUT: ReactGridLayout.Layout[] = [
  {
    i: "requests-count-distribution",
    x: 0,
    y: 0,
    w: 12,
    h: 4,
    static: true,
  },
  {
    i: "cost-distribution",
    x: 0,
    y: 4,
    w: 12,
    h: 4,
    static: true,
  },
  {
    i: "duration-distribution",
    x: 0,
    y: 8,
    w: 12,
    h: 4,
    static: true,
  },
];
