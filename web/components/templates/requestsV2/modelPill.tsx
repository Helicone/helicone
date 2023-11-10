import { clsx } from "../../shared/clsx";
import { getBuilderType } from "./builder/requestBuilder";

interface ModelPillProps {
  model: string;
}

const ModelPill = (props: ModelPillProps) => {
  const { model } = props;

  function generateColorShades(str: string) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    const colors = {
      background: "",
      ring: "",
      text: "",
    };

    for (let i = 0; i < 3; i++) {
      const baseValue = (hash >> (i * 8)) & 0xff;
      // Create a very light color for the background by adding a large value
      colors.background += (
        "00" + Math.min(255, baseValue + 200).toString(16)
      ).slice(-2);
      // Create a light color for the ring by adding a moderate value
      colors.ring += ("00" + Math.min(255, baseValue).toString(16)).slice(-2);
      // Create a darker color for the text by adding a smaller value
      colors.text += ("00" + Math.min(255, baseValue - 10).toString(16)).slice(
        -2
      );
    }

    colors.background = `#${colors.background}`;
    colors.ring = `#${colors.ring}`;
    colors.text = `#${colors.text}`;

    return colors;
  }

  const { background, ring, text } = generateColorShades(model);
  const style = {
    backgroundColor: background,
    color: text,
    boxShadow: `0 0 0 1px ${ring}`,
  };

  return (
    <span
      className={clsx(
        `w-max items-center rounded-lg px-2 py-1 -my-1 text-xs font-medium ring-1 ring-inset`
      )}
      style={style}
    >
      {model && model !== "" ? model : "Unsupported"}
    </span>
  );
};

export default ModelPill;
