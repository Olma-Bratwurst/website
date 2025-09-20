"use client";

import { Transaction } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/Shadcn/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/Shadcn/ui/dropdown-menu";
import { DataTableColumnHeader } from "./datatable-column-header";

export const columns: ColumnDef<Transaction>[] = [
  // {
  //   accessorKey: "KUNDEN_NAME",
  //   header: ({ column }) => (
  //     <DataTableColumnHeader column={column} title="Customer" />
  //   ),
  // },
  {
    accessorKey: "TRX_DATE",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Transaction Date" />
    ),
    cell: ({ row }) => row.original.TRX_DATE || "-",
  },
  {
    accessorKey: "VAL_DATE",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Validation Date" />
    ),
    cell: ({ row }) => row.original.TRX_DATE || "-",
  },
  {
    accessorKey: "TRX_TYPE_SHORT",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Transaction Type" />
    ),
    cell: ({ row }) => row.original.TRX_TYPE_SHORT || "-",
  },
  {
    accessorKey: "AMOUNT",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Amount" />
    ),
    cell: ({ row }) => `${row.original.AMOUNT} ${row.original.MAC_CURRY_NAME}`,
  },
  // {
  //   accessorKey: "BUCHUNGS_ART_NAME",
  //   header: ({ column }) => (
  //     <DataTableColumnHeader column={column} title="Booking Type" />
  //   ),
  // },
  // {
  //   accessorKey: "MACC_TYPE",
  //   header: ({ column }) => (
  //     <DataTableColumnHeader column={column} title="MACC Type" />
  //   ),
  // },
  {
    accessorKey: "POINT_OF_SALE_AND_LOCATION",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Location" />
    ),
  },
  // {
  //   id: "actions",
  //   cell: ({ row }) => {
  //     const trx = row.original;

  //     return (
  //       <DropdownMenu>
  //         <DropdownMenuTrigger asChild>
  //           <Button variant="ghost" className="h-8 w-8 p-0">
  //             <span className="sr-only">Open menu</span>
  //             <MoreHorizontal className="h-4 w-4" />
  //           </Button>
  //         </DropdownMenuTrigger>
  //         <DropdownMenuContent align="end">
  //           <DropdownMenuLabel>Actions</DropdownMenuLabel>
  //           <DropdownMenuItem
  //             onClick={() => {
  //               navigator.clipboard.writeText(trx.id);
  //               toast("ID copied successfully.");
  //             }}
  //           >
  //             Copy ID
  //           </DropdownMenuItem>
  //           <DropdownMenuSeparator />
  //         </DropdownMenuContent>
  //       </DropdownMenu>
  //     );
  //   },
  // },
];
