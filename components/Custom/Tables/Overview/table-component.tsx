"use server";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/Shadcn/ui/card";
import { columns } from "./columns";
import { DataTable } from "./data-table";
import { getAllDatapoints } from "@/server-actions/summary";

export default async function OverviewTable({
}) {

  const lastDataPoints = await getAllDatapoints();
  lastDataPoints.data.map((data) => {
    let newData = data;
    newData.AMOUNT = Math.round(data.AMOUNT ?? 0)
    return newData
  })

  return (
    <>
      <Card className="flex flex-col mb-3 sm:mr-3 mt-5 overflow-hidden">
        <CardHeader className=" pl-3">
          <CardTitle>Transactions Overview</CardTitle>
          <CardDescription></CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={lastDataPoints.data} />
        </CardContent>
      </Card>
    </>
  );
}
