import { Card, CardContent } from "@/components/ui/card";
import { components } from "@/lib/clients/jawnTypes/public";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
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

  const colorScale = scaleLinear<string>()
    .domain([
      Math.min(...data.map((d: any) => d.value)),
      Math.max(...data.map((d: any) => d.value)),
    ])
    .range(["#2A4F7E", "#4ADEEB"]);

  return (
    <Card
      className={`shadow-none border bg-[#0A192F] ${className}`}
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
              scale: 150,
            }}
            className="w-full h-full"
          >
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const country = data.find((d: any) => d.id === geo.id);
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={country ? colorScale(country.value) : "#293548"}
                      stroke="#475569"
                      strokeWidth={0.5}
                      style={{
                        default: {
                          outline: "none",
                        },
                        hover: {
                          fill: "#0EA5E9",
                          outline: "none",
                          cursor: "pointer",
                        },
                        pressed: {
                          fill: "#0EA5E9",
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
