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
        skip,
      });

      return { success: true, data: datapoints };
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
