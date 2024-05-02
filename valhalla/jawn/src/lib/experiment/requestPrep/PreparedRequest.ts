import { Experiment } from "../../stores/experimentStore";

export interface PreparedRequest {
  url: URL;
  headers: { [key: string]: string };
  body: any;
}

export interface PreparedRequestArgs {
  hypothesis: Experiment["hypotheses"][number];
  secretKey: string;
  datasetRow: Experiment["dataset"]["rows"][number];
  requestId: string;
}
