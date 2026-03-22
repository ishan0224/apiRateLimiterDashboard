const integerFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

export function formatInteger(value: number): string {
  return integerFormatter.format(value);
}

export function formatCompact(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}
