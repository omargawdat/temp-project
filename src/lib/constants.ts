export const CURRENCIES = [
  { code: "SAR", flag: "🇸🇦" },
  { code: "AED", flag: "🇦🇪" },
  { code: "QAR", flag: "🇶🇦" },
  { code: "KWD", flag: "🇰🇼" },
  { code: "BHD", flag: "🇧🇭" },
  { code: "OMR", flag: "🇴🇲" },
  { code: "USD", flag: "🇺🇸" },
] as const;

export const DEFAULT_CURRENCY = "SAR";

export const DEFAULT_PORTRAITS = [
  "/images/team/portrait-1.jpg",
  "/images/team/portrait-2.jpg",
  "/images/team/portrait-3.jpg",
  "/images/team/portrait-4.jpg",
  "/images/team/portrait-5.jpg",
];

export const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const DATE_FORMAT_SHORT: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  year: "2-digit",
};

export const DATE_FORMAT_FULL: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  year: "numeric",
};

export const DATE_FORMAT_MONTH_YEAR: Intl.DateTimeFormatOptions = {
  month: "short",
  year: "numeric",
};
