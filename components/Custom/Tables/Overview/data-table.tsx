"use client";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import * as React from "react";
import { Button } from "@/components/Shadcn/ui/button";
import { Card, CardContent } from "@/components/Shadcn/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/Shadcn/ui/table";
import {
  downloadExcelFile,
  generateExcelData,
  getBackgroundColor,
  getTextColor,
} from "@/lib/utils";
import { DataTablePagination } from "./datatable-pagination";
import { DataTableToolbar } from "./datatable-toolbar";
import { ColumnWithMeta } from "./types";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
    initialState: {
      pagination: {
        pageSize: 5, // 👈 set default page size
      },
    },
  });

  const handleLogFilteredRows = () => {
    const formattedData = table.getFilteredRowModel().rows.map((row) => {
      const rowData: Record<string, unknown> = {};
  
      // Define the columns you want to exclude
      const excludedColumns = ["actions"];
  
      table.getAllColumns().forEach((column) => {
        const columnId = column.id;
  
        if (!excludedColumns.includes(columnId)) {
          rowData[columnId] = row.getValue(columnId);
        }
      });
  
      return rowData;
    });

    const workbook = generateExcelData(formattedData);
    downloadExcelFile(workbook);
  };

  return (
    <>
      <Card className="rounded-lg border-none mt-0 w-full">
        <CardContent className="p-0 w-full">
          <div className="flex flex-col relative w-full">
            <div>
              <div className="mt-0 mb-2 w-full">
                <DataTableToolbar table={table} />
              </div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => {
                          return (
                            <TableHead key={header.id}>
                              {header.isPlaceholder ? null : (
                                <>
                                  <div>
                                    {flexRender(
                                      header.column.columnDef.header,
                                      header.getContext(),
                                    )}
                                  </div>
                                </>
                              )}
                            </TableHead>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows?.length ? (
                      table.getRowModel().rows.map((row) => (
                        <TableRow
                          key={row.id}
                          data-state={row.getIsSelected() && "selected"}
                        >
                          {row.getVisibleCells().map((cell) => {
                            const cellValue = String(cell.getValue());
                            const backgroundColor =
                              getBackgroundColor(cellValue);
                            const textColor = getTextColor(cellValue);
                            return (
                              <TableCell key={cell.id}>
                                <div
                                  className={`p-2 ${textColor} ${backgroundColor} rounded`}
                                >
                                  {flexRender(
                                    cell.column.columnDef.cell,
                                    cell.getContext(),
                                  )}
                                </div>
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={columns.length}
                          className="h-24 text-center"
                        >
                          No data to show!
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="flex justify-between items-center flex-wrap">
                <Button onClick={handleLogFilteredRows}>
                  Save as Excel
                </Button>
                <DataTablePagination table={table} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
