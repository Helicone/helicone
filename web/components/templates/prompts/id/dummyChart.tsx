import { AreaChart } from "@tremor/react";

const chartdata = [
  {
    date: "Jan 22",
    SemiAnalysis: 2890,
    "The Pragmatic Engineer": 2338,
  },
  {
    date: "Feb 22",
    SemiAnalysis: 2756,
    "The Pragmatic Engineer": 2103,
  },
  {
    date: "Mar 22",
    SemiAnalysis: 3322,
    "The Pragmatic Engineer": 2194,
  },
  {
    date: "Apr 22",
    SemiAnalysis: 3470,
    "The Pragmatic Engineer": 2108,
  },
  {
    date: "May 22",
    SemiAnalysis: 3475,
    "The Pragmatic Engineer": 1812,
  },
  {
    date: "Jun 22",
    SemiAnalysis: 3129,
    "The Pragmatic Engineer": 1726,
  },
  {
    date: "Jul 22",
    SemiAnalysis: 3490,
    "The Pragmatic Engineer": 1982,
  },
  {
    date: "Aug 22",
    SemiAnalysis: 2903,
    "The Pragmatic Engineer": 2012,
  },
  {
    date: "Sep 22",
    SemiAnalysis: 2643,
    "The Pragmatic Engineer": 2342,
  },
  {
    date: "Oct 22",
    SemiAnalysis: 2837,
    "The Pragmatic Engineer": 2473,
  },
  {
    date: "Nov 22",
    SemiAnalysis: 2954,
    "The Pragmatic Engineer": 3848,
  },
  {
    date: "Dec 22",
    SemiAnalysis: 3239,
    "The Pragmatic Engineer": 3736,
  },
];

const valueFormatter = function (number: number) {
  return "$ " + new Intl.NumberFormat("us").format(number).toString();
};

export function AreaChartUsageExample() {
  return (
    <>
      <AreaChart
        className="h-[14rem] py-2"
        data={chartdata}
        index="date"
        yAxisWidth={65}
        showYAxis={false}
        showGridLines={false}
        categories={["SemiAnalysis", "The Pragmatic Engineer"]}
        colors={["indigo", "cyan"]}
        valueFormatter={valueFormatter}
        showLegend={false}
      />
    </>
  );
}

export const DUMMY_DATA = [
  {
    name: "Viola Amherd",
    Role: "Federal Councillor",
    departement:
      "The Federal Department of Defence, Civil Protection and Sport (DDPS)",
    status: "active",
  },
  {
    name: "Albert Rösti",
    Role: "Federal Councillor",
    departement:
      "The Federal Department of the Environment, Transport, Energy and Communications (DETEC)",
    status: "active",
  },
  {
    name: "Beat Jans",
    Role: "Federal Councillor",
    departement: "The Federal Department of Justice and Police (FDJP)",
    status: "active",
  },
  {
    name: "Ignazio Cassis",
    Role: "Federal Councillor",
    departement: "The Federal Department of Foreign Affairs (FDFA)",
    status: "active",
  },
  {
    name: "Karin Keller-Sutter",
    Role: "Federal Councillor",
    departement: "The Federal Department of Finance (FDF)",
    status: "active",
  },
  {
    name: "Guy Parmelin",
    Role: "Federal Councillor",
    departement:
      "The Federal Department of Economic Affairs, Education and Research (EAER)",
    status: "active",
  },
  {
    name: "Elisabeth Baume-Schneider",
    Role: "Federal Councillor",
    departement: "The Federal Department of Home Affairs (FDHA)",
    status: "active",
  },
];
