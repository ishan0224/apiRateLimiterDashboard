export function formatDateTime(value: string | null): string {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString();
}

export function toIsoHourBucket(date: Date): string {
  const bucket = new Date(date);
  bucket.setMinutes(0, 0, 0);
  return bucket.toISOString();
}
