export type CellData = {
  cellId: string;
  value: any;
  status: "initialized" | "running" | "success";
};
