#!/usr/bin/env node
/**
 * CLI entry point for @helicone/export package
 */

import { exportData, parseArgs, printUsage } from "./index.js";

(async () => {
  try {
    const options = parseArgs();
    await exportData(options);
    process.exit(0);
  } catch (err) {
    if (err instanceof Error) {
      console.error("Error:", err.message);
    } else {
      console.error("An unknown error occurred");
    }
    printUsage();
    process.exit(1);
  }
})();
