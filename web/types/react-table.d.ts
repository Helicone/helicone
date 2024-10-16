import {
  UseTableInstanceProps,
  UsePaginationInstanceProps,
  UseSortByInstanceProps,
  TableState as ReactTableState,
} from "react-table";

declare module "react-table" {
  export interface TableInstance<D extends object = {}>
    extends UseTableInstanceProps<D>,
      UsePaginationInstanceProps<D>,
      UseSortByInstanceProps<D> {}

  export type TableState<D extends object = {}> = ReactTableState<D>;
}
