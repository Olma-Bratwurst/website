"use server";

import { cache } from "react";
import { db } from "@/db";

export const getLastDatapoints = cache(
  async (limit = 15, skip = 0) => {
    try {
      const datapoints = await db.transaction.findMany({
        orderBy: { TRX_DATE: "desc" },
        take: limit,
        skip,
      });

      return { success: true, data: datapoints };
    } catch (error) {
      console.error("getLastDatapoints error:", error);
      return { success: false, data: [] };
    }
  }
);

export const getAllDatapoints = cache(
  async (skip = 0) => {
    try {
      const datapoints = await db.transaction.findMany({
        orderBy: { TRX_DATE: "desc" },
        // take: 1000,
        skip,
      });

      const filtered_data = datapoints.filter((datapoint) => {
        return datapoint.TRX_DATE?.split("/")[1] === "08" && datapoint.TRX_DATE.split("/")[2] === "2025"
      })

      return { success: true, data: filtered_data };
    } catch (error) {
      console.error("getAllDatapoints error:", error);
      return { success: false, data: [] };
    }
  }
);

export const getCategoryDatapoints = cache(
  async (limit = 15, skip = 0) => {
    try {
      const datapoints = await db.transaction.findMany({
        orderBy: { TRX_DATE: "desc" },
        take: limit,
        skip,
      });

      return { success: true, data: datapoints };
    } catch (error) {
      console.error("getLastDatapoints error:", error);
      return { success: false, data: [] };
    }
  }
);
