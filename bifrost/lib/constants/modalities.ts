export const INPUT_MODALITIES = ["text", "image", "audio", "video"] as const;
export const OUTPUT_MODALITIES = ["text", "image", "audio", "video"] as const;

export const MODALITY_LABELS: Record<string, string> = {
  text: "Text",
  image: "Image",
  audio: "Audio",
  video: "Video",
};

export function capitalizeModality(modality: string): string {
  return modality.charAt(0).toUpperCase() + modality.slice(1);
}
