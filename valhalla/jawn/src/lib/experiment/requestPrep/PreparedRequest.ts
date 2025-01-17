import { Experiment } from "../../stores/experimentStore";

export interface PreparedRequest {
  url: URL;
  headers: { [key: string]: string };
  body: any;
}

export interface PreparedRequestArgs {
  providerKey: string | null;
  template: any;
  secretKey: string;
  inputs: Record<string, any>;
  autoInputs: Record<string, any>[];
  requestPath?: string;
  requestId: string;
  columnId?: string;
  rowIndex?: number;
  experimentId?: string;
  model?: string;
}
