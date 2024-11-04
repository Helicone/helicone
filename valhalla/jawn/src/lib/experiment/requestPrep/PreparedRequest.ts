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
  datasetRow: Experiment["dataset"]["rows"][number];
  requestId: string;
  columnId?: string;
  rowIndex?: number;
}
