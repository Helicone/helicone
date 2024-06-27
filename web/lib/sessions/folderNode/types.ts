export interface Trace {
  start_unix_timestamp_ms: number;
  end_unix_timestamp_ms: number;
  properties: Record<string, string>;
  path: string;
  request_id: string;
}

export interface FolderNode {
  folderName: string;
  children: (FolderNode | Trace)[];
}
