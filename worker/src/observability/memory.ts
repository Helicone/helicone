import v8 from "v8";

export const logObjectMemoryUsage = (object: any, name: string) => {
  try {
    const size = new TextEncoder().encode(JSON.stringify(object)).length;
    console.log("MEMORY_REPORT: ${name} Object memory usage", size);
    console.log(
      "MEMORY_REPORT_HEAP_STATS: ${name}: heap statistics",
      v8.getHeapStatistics()
    );
  } catch (e) {
    console.error("MEMORY_REPORT: Error logging object memory usage", e);
  }
};
