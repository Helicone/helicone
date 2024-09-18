import { useState } from "react";
import { clsx } from "@/components/shared/utils";

interface SliderProps {
  min: number;
  max: number;
  exponent: number;
  onChange: (value: number) => void;
  color?: string;
  labels?: Record<string, string>;
}

const Slider: React.FC<SliderProps> = ({
  min,
  max,
  exponent,
  onChange,
  color = "purple",
  labels,
}) => {
  // This function converts the slider's linear value to an exponential value.
  const toExponentialValue = (linearValue: number) => {
    return Math.pow(linearValue / max, exponent) * (max - min) + min;
  };

  // This function converts an exponential value to the slider's linear value.
  const toLinearValue = (exponentialValue: number) => {
    return Math.pow((exponentialValue - min) / (max - min), 1 / exponent) * max;
  };

  // Initialize the slider's value using the inverse transformation function.
  const [sliderValue, setSliderValue] = useState(toLinearValue(min));

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const linearValue = Number(e.target.value);
    setSliderValue(linearValue);
    const expValue = toExponentialValue(linearValue);
    onChange(expValue);
  };

  // Calculate the offset for a label based on its value
  const calculateOffset = (value: number) => {
    const linearValue = toLinearValue(value);
    const percentage = ((linearValue - min) / (max - min)) * 100;
    return `${percentage}%`;
  };

  return (
    <div className="slider-container relative my-4">
      <input
        type="range"
        min={0}
        max={max}
        value={sliderValue}
        onChange={handleSliderChange}
        className="w-full"
      />
      {labels && (
        <div className="relative w-full flex justify-between">
          {Object.entries(labels).map(([key, text], idx) => (
            <button
              key={key}
              className={clsx(
                toExponentialValue(sliderValue) >= Number(key)
                  ? "font-bold text-black"
                  : "text-gray-500",
                "absolute text-xs"
              )}
              onClick={() => {
                setSliderValue(toLinearValue(Number(key)));
                onChange(Number(key));
              }}
              style={{
                left: `calc(${calculateOffset(Number(key))} - ${
                  idx * 0.25
                }rem)`,
              }}
            >
              {text}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Slider;
