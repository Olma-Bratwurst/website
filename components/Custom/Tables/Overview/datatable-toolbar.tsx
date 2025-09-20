"use client";

import { Cross2Icon } from "@radix-ui/react-icons";
import { ResponsiveWrapper } from "@/components/responsive-wrapper";
import { Button } from "@/components/Shadcn/ui/button";
import { Input } from "@/components/Shadcn/ui/input";
import { statusOptions } from "./data";
import { DataTableFacetedFilter } from "./datatable-faceted-filter";
import { DataTableViewOptions } from "./datatable-view-option";
import { DataTableToolbarProps } from "./types";

export function DataTableToolbar<TData>({
  table,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <>
      <ResponsiveWrapper>
        <div></div>
        <Input
          placeholder="Search location ..."
          value={
            (table.getColumn("POINT_OF_SALE_AND_LOCATION")?.getFilterValue() as string) ?? ""
          }
          onChange={(event) =>
            table.getColumn("POINT_OF_SALE_AND_LOCATION")?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {table.getColumn("TRX_TYPE_SHORT") && (
          <DataTableFacetedFilter
            column={table.getColumn("TRX_TYPE_SHORT")}
            title="Transaction Type"
            options={statusOptions}
          />
        )}
        <div className="w-full flex flex-wrap">
          <div></div>
        </div>
      </ResponsiveWrapper>
      <div className="w-full flex flex-wrap space-x-2">
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="ml-auto hidden h-8 mt-2 flex"
            style={{ color: "red" }}
          >
            Reset
            <Cross2Icon className="ml-2 h-4 w-4" />
          </Button>
        )}
        {/* <DataTableViewOptions table={table} /> */}
      </div>
    </>
  );
}
