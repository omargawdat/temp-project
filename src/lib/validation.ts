export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export function parseRequiredString(formData: FormData, field: string): string {
  const value = (formData.get(field) as string)?.trim();
  if (!value) {
    throw new ValidationError(`${formatFieldName(field)} is required.`);
  }
  return value;
}

export function parseOptionalString(formData: FormData, field: string): string | null {
  const value = (formData.get(field) as string)?.trim();
  return value || null;
}

export function parseDecimal(formData: FormData, field: string): string {
  const raw = (formData.get(field) as string)?.trim();
  if (!raw) {
    throw new ValidationError(`${formatFieldName(field)} is required.`);
  }
  const num = Number(raw);
  if (isNaN(num) || num < 0) {
    throw new ValidationError(`${formatFieldName(field)} must be a valid non-negative number.`);
  }
  return raw;
}

export function parsePositiveDecimal(formData: FormData, field: string): string {
  const raw = parseDecimal(formData, field);
  if (Number(raw) <= 0) {
    throw new ValidationError(`${formatFieldName(field)} must be greater than zero.`);
  }
  return raw;
}

export function parseDate(formData: FormData, field: string): Date {
  const raw = (formData.get(field) as string)?.trim();
  if (!raw) {
    throw new ValidationError(`${formatFieldName(field)} is required.`);
  }
  const date = new Date(raw);
  if (isNaN(date.getTime())) {
    throw new ValidationError(`${formatFieldName(field)} is not a valid date.`);
  }
  return date;
}

export function parseBoolean(formData: FormData, field: string): boolean {
  const value = formData.get(field);
  return value === "on" || value === "true" || value === "1";
}

export function parseEnum<T extends string>(
  formData: FormData,
  field: string,
  validValues: readonly T[],
): T {
  const raw = (formData.get(field) as string)?.trim();
  if (!raw || !validValues.includes(raw as T)) {
    throw new ValidationError(
      `${formatFieldName(field)} must be one of: ${validValues.join(", ")}.`,
    );
  }
  return raw as T;
}

export function validateDateRange(start: Date, end: Date): void {
  if (end <= start) {
    throw new ValidationError("End date must be after start date.");
  }
}

export function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError("Please enter a valid email address.");
  }
}

function formatFieldName(field: string): string {
  return field
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}
