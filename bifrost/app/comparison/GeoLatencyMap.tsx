import { Card, CardContent } from "@/components/ui/card";
import { components } from "@/lib/clients/jawnTypes/public";
import {
  ComposableMap,
  Geographies,
  Geography,
  Graticule,
  Sphere,
} from "react-simple-maps";
import { scaleLinear } from "d3-scale";
import ISO31661 from "iso-3166-1";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { formatLatency, formatPercentage } from "../utils/formattingUtils";
import { MetricType } from "./GeographicMetricSection";

const geoUrl = "/countries-50m.json";

interface GeoMetricMapProps {
  model: components["schemas"]["Model"];
  metric: MetricType;
  className?: string;
  style?: React.CSSProperties;
}

const formatValue = (value: number, metric: MetricType) => {
  switch (metric) {
    case "latency":
      return `${formatLatency(value)} per 1k tokens`;
    case "ttft":
      return `${formatLatency(value)}`;
    case "errorRate":
      return `${formatPercentage(value)}`;
    default:
      return `${value}`;
  }
};

const getGeographicData = (
  model: components["schemas"]["Model"],
  metric: MetricType
) => {
  const geoData =
    metric === "latency" ? model.geographicLatency : model.geographicTtft;

  if (!geoData || geoData.length === 0) {
    return [];
  }

  return geoData.map((geo: { countryCode: string; median: number }) => {
    const country = ISO31661.whereAlpha2(geo.countryCode);
    return {
      id: country?.numeric || geo.countryCode,
      value: geo.median,
      name: country?.country || geo.countryCode,
    };
  });
};

export const GeoMetricMap = ({
  model,
  metric,
  className,
  style,
}: GeoMetricMapProps) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [localTooltipContent, setLocalTooltipContent] = useState("");

  const data = getGeographicData(model, metric);

  if (data.length === 0) {
    return (
      <Card
        className={`shadow-none border bg-[#0A192F] ${className}`}
        style={style}
      >
        <CardContent className="p-4 flex items-center justify-center h-[400px]">
          <p className="text-gray-400">No geographic data available</p>
        </CardContent>
      </Card>
    );
  }

  console.log(
    "Geographic data:",
    data.map((d) => ({
      country: d.name,
      value: d.value,
    }))
  );

  const minValue = Math.min(...data.map((d: any) => d.value));
  const maxValue = Math.max(...data.map((d: any) => d.value));

  const colorScale = scaleLinear<string>()
    .domain([
      minValue,
      minValue + (maxValue - minValue) * 0.3, // 30% point
      minValue + (maxValue - minValue) * 0.6, // 60% point
      maxValue,
    ])
    .range([
      "rgb(184, 225, 240)",
      "rgb(120, 180, 220)",
      "rgb(24, 158, 211)",
      "rgb(8, 104, 172)",
    ])
    .clamp(true);

  return (
    <Card
      className={`shadow-none border-none bg-white ${className}`}
      style={style}
    >
      <CardContent className="p-4">
        <div
          className="relative"
          onMouseMove={(e) => {
            setMousePosition({
              x: e.clientX,
              y: e.clientY,
            });
          }}
        >
          <ComposableMap
            width={800}
            height={400}
            projectionConfig={{
              rotate: [-10, 0, 0],
              scale: 147,
            }}
            className="w-full h-full"
          >
            <Sphere
              stroke="#E4E5E6"
              strokeWidth={0.5}
              id={"sphere1"}
              fill={"#ffffff"}
            />
            <Graticule stroke="#E4E5E6" strokeWidth={0.5} />
            {data.length > 0 && (
              <Geographies geography={geoUrl}>
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const country = data.find((d: any) => d.id === geo.id);
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={
                          country && country.value > 0
                            ? colorScale(Math.max(1, country.value))
                            : "#e5e7eb"
                        }
                        stroke="#ffffff"
                        strokeWidth={0.5}
                        style={{
                          default: {
                            outline: "none",
                          },
                          hover: {
                            fill: "#0ea5e9",
                            outline: "none",
                            cursor: "pointer",
                          },
                          pressed: {
                            fill: "#0ea5e9",
                            outline: "none",
                          },
                        }}
                        onMouseEnter={() => {
                          if (country) {
                            setTooltipOpen(true);
                            const tooltipText = `${country.name}\n${formatValue(
                              country.value,
                              metric
                            )}`;
                            setLocalTooltipContent(tooltipText);
                          }
                        }}
                        onMouseLeave={() => {
                          setTooltipOpen(false);
                          setLocalTooltipContent("");
                        }}
                      />
                    );
                  })
                }
              </Geographies>
            )}
          </ComposableMap>
          <TooltipProvider>
            <Tooltip open={tooltipOpen}>
              <TooltipContent
                style={{
                  position: "fixed",
                  left: `${mousePosition.x}px`,
                  top: `${mousePosition.y - 40}px`,
                  minWidth: "200px",
                  width: "fit-content",
                }}
                className="pointer-events-none whitespace-pre-line"
              >
                {localTooltipContent}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
};
