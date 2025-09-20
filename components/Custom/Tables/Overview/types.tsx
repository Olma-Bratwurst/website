/**
 *
 * Define all special types to be used in this folder in this file.
 *
 **/

import { Column, ColumnDef , Table } from "@tanstack/react-table";

export interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

interface ColumnMeta {
  filterVariant?: "select-review-decision" | "text";
}

export type ColumnWithMeta<TData, TValue> = Column<TData, TValue> & {
  columnDef: ColumnDef<TData, TValue> & {
    meta?: ColumnMeta;
  };
};
