export function tryParse(text: string, errorMsg?: string): any {
  try {
    return JSON.parse(text);
  } catch (e) {
    return {
      error: `Error parsing ${errorMsg}, ${e}, ${text}`,
    };
  }
}
