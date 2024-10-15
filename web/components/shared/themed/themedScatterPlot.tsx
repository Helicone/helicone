import { MultiSelect, MultiSelectItem, ScatterChart } from "@tremor/react";
import { useEffect, useState } from "react";

export const ThemedScatterPlot = ({
  chart,
}: {
  chart: {
    data: {
      grain: string;
      x: number;
      y: number;
      default?: boolean;
    }[];
    name: string;
    x: {
      label: string;
      formatter: (v: any) => string;
    };
    y: {
      label: string;
      formatter: (v: any) => string;
    };
  };
}) => {
  const multiSelectItems = new Set<string>();
  chart.data.forEach((d) => multiSelectItems.add(d.grain));

  const multiSelectItemsArray = Array.from(multiSelectItems);
  const [selectItems, setSelectItems] = useState<string[]>([]);

  useEffect(() => {
    if (selectItems.length === 0) {
      const multiSelectItems = new Set<string>();
      chart.data.forEach((d) =>
        d.default ? multiSelectItems.add(d.grain) : null
      );

      const multiSelectItemsArray = Array.from(multiSelectItems);
      setSelectItems(multiSelectItemsArray);
    }
  }, [chart.data, selectItems.length]);

  const dataToViz = chart.data.filter((d) => selectItems.includes(d.grain));

  return (
    <div className=" border w-full  col-span-1 md:col-span-6  flex flex-col items-center gap-5 p-3 rounded-lg bg-[#0B173980] bg-opacity-50 border-[#63758933] border-opacity-20">
      <div className="flex flex-col sm:flex-row justify-between items-center w-full gap-3">
        <h2 className="whitespace-nowrap">{chart.name}</h2>
        <MultiSelect
          // label="Select Grain"
          className=" w-12"
          // selected={selectItems}
          defaultChecked={true}
          onValueChange={(v) => {
            setSelectItems(v);
          }}
          value={selectItems}
          // defaultValue={multiSelectItemsArray}
        >
          {[...multiSelectItemsArray].map((item) => (
            <MultiSelectItem key={item} value={item} defaultChecked={true} />
          ))}
        </MultiSelect>
      </div>

      <ScatterChart
        className=""
        yAxisWidth={50}
        data={dataToViz}
        category="grain"
        x="x"
        y="y"
        valueFormatter={{
          x: chart.x.formatter,
          y: chart.y.formatter,
        }}
        size="z"
        sizeRange={[1, 100000]}
        colors={["blue", "red", "green", "yellow"]}
        showLegend={true}
        xAxisLabel={chart.x.label}
        yAxisLabel={chart.y.label}
      />
    </div>
  );
};
