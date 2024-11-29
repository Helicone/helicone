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

const geoUrl = "/countries-50m.json";

interface GeographicLatencyMapProps {
  model: components["schemas"]["Model"];
  className?: string;
  style?: React.CSSProperties;
  setTooltipContent: (content: string) => void;
}

export const GeographicLatencyMap = ({
  model,
  className,
  style,
  setTooltipContent,
}: GeographicLatencyMapProps) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [localTooltipContent, setLocalTooltipContent] = useState("");

  const data = model.geographicLatency.map((geo) => {
    const country = ISO31661.whereAlpha2(geo.countryCode);
    return {
      id: country?.numeric || geo.countryCode,
      value: geo.latency.averagePerCompletionToken,
      name: country?.country || geo.countryCode,
    };
  });

  const colorScale = scaleLinear<string>()
    .domain([
      Math.min(...data.map((d) => d.value)),
      Math.max(...data.map((d) => d.value)),
    ])
    .range(["#e5f5ff", "#0077cc"]);

  return (
    <Card className={`shadow-none border ${className}`} style={style}>
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
                  const country = data.find((d) => d.id === geo.id);
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={country ? colorScale(country.value) : "#F5F5F5"}
                      stroke="#D6D6DA"
                      strokeWidth={0.5}
                      style={{
                        default: {
                          outline: "none",
                        },
                        hover: {
                          fill: "#90CDF4",
                          outline: "none",
                          cursor: "pointer",
                        },
                        pressed: {
                          fill: "#90CDF4",
                          outline: "none",
                        },
                      }}
                      onMouseEnter={() => {
                        if (country) {
                          setTooltipOpen(true);
                          setLocalTooltipContent(
                            `${country.name}: ${country.value.toFixed(3)}ms`
                          );
                          setTooltipContent(
                            `${country.name}: ${country.value.toFixed(3)}ms`
                          );
                        }
                      }}
                      onMouseLeave={() => {
                        setTooltipOpen(false);
                        setLocalTooltipContent("");
                        setTooltipContent("");
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
                }}
                className="pointer-events-none"
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
