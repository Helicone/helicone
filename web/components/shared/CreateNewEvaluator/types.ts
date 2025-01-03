export type EvaluatorTestResult =
  | {
      output: string;
      traces: string[];
      statusCode?: number;
      _type: "completed";
    }
  | {
      _type: "running";
    }
  | {
      _type: "error";
      error: string;
    }
  | null;

export type TestInput = {
  inputBody: string;
  outputBody: string;
  inputs: {
    inputs: Record<string, string>;
    autoInputs?: Record<string, string>;
  };
  prompt?: string;
};
