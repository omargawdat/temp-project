import { PAGE_SIZE } from "@/lib/constants";

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  skip: number;
  take: number;
}

export function parsePage(raw: string | string[] | undefined): number {
  const parsed = typeof raw === "string" ? parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) && parsed >= 1 ? parsed : 1;
}

export function getPaginationMeta(
  page: number,
  totalCount: number,
): PaginationMeta {
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  return {
    page: safePage,
    pageSize: PAGE_SIZE,
    totalCount,
    totalPages,
    skip: (safePage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  };
}
