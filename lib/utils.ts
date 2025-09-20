import { type ClassValue , clsx} from "clsx"
import { twMerge } from "tailwind-merge"
import * as XLSX from "xlsx";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function makeSlug(item: { title: string; id: string }) {
  return (
    item.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") +
    "-" +
    item.id
  );
}

export function truncateWords(text: string, limit = 10) {
  const words = text.split(" ");
  return words.length > limit
    ? words.slice(0, limit).join(" ") + "..."
    : text;
}

export const getBackgroundColor = (value: string) => {
  if (typeof value === "string") {
    switch (value) {
      case "accepted":
        return "bg-green-200";
      case "pending":
        return "bg-yellow-200";
      case "Pending":
        return "bg-yellow-200";
      case "rejected":
        return "bg-red-200";
      case "Rejected":
        return "bg-red-200";
      case "Approved":
        return "bg-green-200";
      case "approved":
        return "bg-green-200";
      case "not-sure":
        return "bg-gray-200";
      case "not-started":
        return "bg-pink-200";
      case "processing":
        return "bg-blue-200";
      case "Processing":
        return "bg-blue-200";
      case "on-hold":
        return "bg-violet-200";
      case "On-Hold":
        return "bg-violet-200";
      case "no-response":
        return "bg-orange-200";
      case "No-Response":
        return "bg-orange-200";
      default:
        return "";
    }
  }
  return "";
};

export const getTextColor = (value: string) => {
  if (typeof value === "string") {
    switch (value) {
      case "accepted":
        return "text-green-700";
      case "pending":
        return "text-yellow-700";
      case "Pending":
        return "text-yellow-700";
      case "rejected":
        return "text-red-700";
      case "Rejected":
        return "text-red-700";
      case "Approved":
        return "text-green-700";
      case "approved":
        return "text-green-700";
      case "not-sure":
        return "text-gray-700";
      case "not-started":
        return "text-pink-700";
      case "processing":
        return "text-blue-700";
      case "Processing":
        return "text-blue-700";
      case "on-hold":
        return "text-violet-700";
      case "On-Hold":
        return "text-violet-700";
      case "no-response":
        return "text-orange-700";
      case "No-Response":
        return "text-orange-700";
      default:
        return "";
    }
  }
  return "";
};

export const generateExcelData = (data: unknown[]) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
  return workbook;
};

export const downloadExcelFile = (workbook: XLSX.WorkBook) => {
  XLSX.writeFile(workbook, "report.xlsx");
};