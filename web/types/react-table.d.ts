import {
  UseTableInstanceProps,
  UsePaginationInstanceProps,
  UseSortByInstanceProps,
} from "react-table";

declare module "react-table" {
  export interface TableInstance<D extends object = {}>
    extends UseTableInstanceProps<D>,
      UsePaginationInstanceProps<D>,
      UseSortByInstanceProps<D> {}
}
\
