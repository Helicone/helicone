import v8 from "v8";

export const logObjectMemoryUsage = async (object: any, name: string) => {
  try {
    const size = new TextEncoder().encode(JSON.stringify(object)).length;
    console.log(`MEMORY_REPORT: ${name} Object memory usage`, size);
    console.log(
      `MEMORY_REPORT_HEAP_STATS: ${name}: heap statistics`,
      v8.getHeapStatistics(),
      v8.getHeapSpaceStatistics(),
      await v8.getHeapSnapshot().read()
    );
  } catch (e) {
    console.error(
      `MEMORY_REPORT ${name}: Error logging object memory usage`,
      e
    );
  }
};
