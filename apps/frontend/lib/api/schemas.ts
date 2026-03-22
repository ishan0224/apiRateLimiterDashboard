import { z } from "zod";

const isoDateSchema = z
  .string()
  .datetime({ offset: true })
  .or(z.string().datetime())
  .optional();

const positiveIntSchema = z.coerce.number().int().min(1);

export const rangeQuerySchema = z.object({
  from: isoDateSchema,
  to: isoDateSchema,
});

export const keysQuerySchema = rangeQuerySchema.extend({
  page: positiveIntSchema.optional(),
  pageSize: positiveIntSchema.max(100).optional(),
  search: z.string().trim().optional(),
});

export const trafficQuerySchema = rangeQuerySchema.extend({
  granularity: z.enum(["15m", "1h", "1d"]).optional(),
});

export const incidentsQuerySchema = rangeQuerySchema.extend({
  status: z.enum(["open", "resolved", "all"]).optional(),
});

export function parseRangeParams(params: { from?: string; to?: string }) {
  const parsed = rangeQuerySchema.safeParse(params);

  if (!parsed.success) {
    return {
      from: new Date(Date.now() - 24 * 60 * 60 * 1000),
      to: new Date(),
    };
  }

  const from = parsed.data.from ? new Date(parsed.data.from) : new Date(Date.now() - 24 * 60 * 60 * 1000);
  const to = parsed.data.to ? new Date(parsed.data.to) : new Date();

  return { from, to };
}
