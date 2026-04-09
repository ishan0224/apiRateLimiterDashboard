"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Globe,
} from "lucide-react";

import { cn } from "@/lib/utils/cn";
import {
  computeQuickRange,
  detectMatchingQuickRange,
  endOfDayInTimeZone,
  formatInputDateTime,
  formatTimeZoneIndicator,
  getCivilDateInTimeZone,
  getDayKeyInTimeZone,
  getTimeZoneOptions,
  getUtcDateForCivilDay,
  isValidRange,
  MAX_RANGE_WINDOW_MS,
  parseTimeExpression,
  QUICK_RANGE_SECTIONS,
  toCivilKey,
  type QuickRangeKey,
  type TimeZoneValue,
} from "@/lib/time-range";
import type { ActiveRange, ApplyRangeInput } from "@/hooks/dashboard/useDashboardFilters";

type TimeRangeDropdownProps = {
  activeRange: ActiveRange;
  onApplyRange: (input: ApplyRangeInput) => boolean;
};

type CalendarMonth = {
  year: number;
  monthIndex: number;
};

type CalendarCell = {
  year: number;
  month: number;
  day: number;
  key: string;
  inMonth: boolean;
};

const weekDayLabels = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function parseCivilKey(key: string) {
  const [yearText, monthText, dayText] = key.split("-");
  return {
    year: Number(yearText),
    month: Number(monthText),
    day: Number(dayText),
  };
}

function shiftMonth(month: CalendarMonth, diff: number): CalendarMonth {
  const shifted = new Date(Date.UTC(month.year, month.monthIndex + diff, 1));
  return {
    year: shifted.getUTCFullYear(),
    monthIndex: shifted.getUTCMonth(),
  };
}

function monthFromDate(date: Date, timeZone: TimeZoneValue): CalendarMonth {
  const parts = getCivilDateInTimeZone(date, timeZone);
  return {
    year: parts.year,
    monthIndex: parts.month - 1,
  };
}

function monthHeading(month: CalendarMonth) {
  return new Intl.DateTimeFormat(undefined, {
    month: "long",
    year: "numeric",
  }).format(new Date(Date.UTC(month.year, month.monthIndex, 1)));
}

function getCalendarCells(month: CalendarMonth): CalendarCell[] {
  const first = new Date(Date.UTC(month.year, month.monthIndex, 1));
  const gridStart = new Date(first);
  gridStart.setUTCDate(first.getUTCDate() - first.getUTCDay());

  const cells: CalendarCell[] = [];
  for (let index = 0; index < 42; index += 1) {
    const next = new Date(gridStart);
    next.setUTCDate(gridStart.getUTCDate() + index);

    const year = next.getUTCFullYear();
    const numericMonth = next.getUTCMonth() + 1;
    const day = next.getUTCDate();
    cells.push({
      year,
      month: numericMonth,
      day,
      key: toCivilKey({ year, month: numericMonth, day }),
      inMonth: next.getUTCMonth() === month.monthIndex,
    });
  }

  return cells;
}

function normalizePreviewKeys(
  pendingFrom: Date | null,
  pendingTo: Date | null,
  hoverKey: string | null,
  selectingEnd: boolean,
  timeZone: TimeZoneValue
) {
  const fromKey = pendingFrom ? getDayKeyInTimeZone(pendingFrom, timeZone) : null;
  const toKey = pendingTo ? getDayKeyInTimeZone(pendingTo, timeZone) : null;

  if (fromKey && toKey) {
    return fromKey <= toKey ? { startKey: fromKey, endKey: toKey } : { startKey: toKey, endKey: fromKey };
  }

  if (selectingEnd && fromKey && hoverKey) {
    return fromKey <= hoverKey
      ? { startKey: fromKey, endKey: hoverKey }
      : { startKey: hoverKey, endKey: fromKey };
  }

  return { startKey: fromKey, endKey: null as string | null };
}

function inPreviewRange(cellKey: string, startKey: string | null, endKey: string | null) {
  if (!startKey || !endKey) {
    return false;
  }

  return cellKey >= startKey && cellKey <= endKey;
}

export function TimeRangeDropdown({ activeRange, onApplyRange }: TimeRangeDropdownProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  const [open, setOpen] = useState(false);
  const [selectedTimeZone, setSelectedTimeZone] = useState<TimeZoneValue>(activeRange.timeZone);
  const [fromInput, setFromInput] = useState("");
  const [toInput, setToInput] = useState("");
  const [pendingFrom, setPendingFrom] = useState<Date | null>(null);
  const [pendingTo, setPendingTo] = useState<Date | null>(null);
  const [selectingEnd, setSelectingEnd] = useState(false);
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const [leftMonth, setLeftMonth] = useState<CalendarMonth>(() => monthFromDate(activeRange.from, activeRange.timeZone));
  const [error, setError] = useState<string | null>(null);

  const rightMonth = useMemo(() => shiftMonth(leftMonth, 1), [leftMonth]);
  const leftCells = useMemo(() => getCalendarCells(leftMonth), [leftMonth]);
  const rightCells = useMemo(() => getCalendarCells(rightMonth), [rightMonth]);
  const timeZoneOptions = useMemo(() => getTimeZoneOptions(), []);
  const rollingQuickRanges = useMemo(
    () => QUICK_RANGE_SECTIONS.find((section) => section.key === "rolling")?.items ?? [],
    []
  );

  const preview = useMemo(
    () => normalizePreviewKeys(pendingFrom, pendingTo, hoverKey, selectingEnd, selectedTimeZone),
    [pendingFrom, pendingTo, hoverKey, selectingEnd, selectedTimeZone]
  );

  const syncFromActiveRange = () => {
    setSelectedTimeZone(activeRange.timeZone);
    setFromInput(formatInputDateTime(activeRange.from, activeRange.timeZone));
    setToInput(formatInputDateTime(activeRange.to, activeRange.timeZone));
    setPendingFrom(activeRange.from);
    setPendingTo(activeRange.to);
    setSelectingEnd(false);
    setHoverKey(null);
    setLeftMonth(monthFromDate(activeRange.from, activeRange.timeZone));
    setError(null);
  };

  useEffect(() => {
    if (!open) {
      syncFromActiveRange();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeRange.from, activeRange.to, activeRange.quickRangeKey, activeRange.timeZone]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleOutside = (event: MouseEvent) => {
      if (!rootRef.current) {
        return;
      }

      if (event.target instanceof Node && !rootRef.current.contains(event.target)) {
        syncFromActiveRange();
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeRange.from, activeRange.to, activeRange.quickRangeKey, activeRange.timeZone]);

  const toggleDropdown = () => {
    if (open) {
      syncFromActiveRange();
      setOpen(false);
      return;
    }

    syncFromActiveRange();
    setOpen(true);
  };

  const handleTimeZoneChange = (nextTimeZone: TimeZoneValue) => {
    setSelectedTimeZone(nextTimeZone);
    setError(null);

    if (pendingFrom) {
      setFromInput(formatInputDateTime(pendingFrom, nextTimeZone));
    }

    if (pendingTo) {
      setToInput(formatInputDateTime(pendingTo, nextTimeZone));
    }

    setLeftMonth(monthFromDate(pendingFrom ?? activeRange.from, nextTimeZone));
  };

  const applyQuickRange = (key: QuickRangeKey) => {
    const anchor = new Date();
    const resolved = computeQuickRange(key, anchor, selectedTimeZone);
    const ok = onApplyRange({
      from: resolved.from,
      to: resolved.to,
      quickRangeKey: key,
      timeZone: selectedTimeZone,
    });

    if (ok) {
      setOpen(false);
    }
  };

  const handleFromInputChange = (value: string) => {
    setFromInput(value);
    setError(null);

    const parsed = parseTimeExpression(value, new Date(), selectedTimeZone);
    if (parsed) {
      setPendingFrom(parsed);
      setLeftMonth(monthFromDate(parsed, selectedTimeZone));
    }
  };

  const handleToInputChange = (value: string) => {
    setToInput(value);
    setError(null);

    const parsed = parseTimeExpression(value, new Date(), selectedTimeZone);
    if (parsed) {
      setPendingTo(parsed);
    }
  };

  const handleDayClick = (cell: CalendarCell) => {
    const dayStart = getUtcDateForCivilDay({ year: cell.year, month: cell.month, day: cell.day }, selectedTimeZone);

    if (!selectingEnd || !pendingFrom) {
      setPendingFrom(dayStart);
      setPendingTo(null);
      setFromInput(formatInputDateTime(dayStart, selectedTimeZone));
      setToInput("");
      setSelectingEnd(true);
      setHoverKey(null);
      setError(null);
      return;
    }

    const fromKey = getDayKeyInTimeZone(pendingFrom, selectedTimeZone);
    const selectedKey = cell.key;
    const startKey = fromKey <= selectedKey ? fromKey : selectedKey;
    const endKey = fromKey <= selectedKey ? selectedKey : fromKey;

    const startCivil = parseCivilKey(startKey);
    const endCivil = parseCivilKey(endKey);

    const from = getUtcDateForCivilDay(startCivil, selectedTimeZone);
    const to = endOfDayInTimeZone(getUtcDateForCivilDay(endCivil, selectedTimeZone), selectedTimeZone);

    setPendingFrom(from);
    setPendingTo(to);
    setFromInput(formatInputDateTime(from, selectedTimeZone));
    setToInput(formatInputDateTime(to, selectedTimeZone));
    setSelectingEnd(false);
    setHoverKey(null);
    setError(null);
  };

  const cancel = () => {
    syncFromActiveRange();
    setOpen(false);
  };

  const applyManualRange = () => {
    const anchor = new Date();
    const parsedFrom = parseTimeExpression(fromInput, anchor, selectedTimeZone);
    const parsedTo = parseTimeExpression(toInput, anchor, selectedTimeZone);

    if (!parsedFrom || !parsedTo) {
      setError("Enter valid values. Supported: absolute timestamps, now-24h, now-7d, now/d, now/w, now/M");
      return;
    }

    if (!isValidRange(parsedFrom, parsedTo, MAX_RANGE_WINDOW_MS)) {
      setError("Invalid range. Ensure From is earlier than To and window is at most 30 days.");
      return;
    }

    const matchedQuickRange = detectMatchingQuickRange(
      parsedFrom,
      parsedTo,
      anchor,
      selectedTimeZone
    );

    const ok = onApplyRange({
      from: parsedFrom,
      to: parsedTo,
      quickRangeKey: matchedQuickRange,
      timeZone: selectedTimeZone,
    });

    if (!ok) {
      setError("Could not apply selected range.");
      return;
    }

    setError(null);
    setOpen(false);
  };

  const renderCalendar = (month: CalendarMonth, cells: CalendarCell[], side: "left" | "right") => {
    const todayKey = getDayKeyInTimeZone(new Date(), selectedTimeZone);

    return (
      <div className="w-[235px]">
        <div className="mb-2 flex items-center justify-between">
          <button
            type="button"
            className="focus-ring rounded-[2px] p-1 text-[#8e919e] hover:bg-[#2c2f38]"
            onClick={() => setLeftMonth(shiftMonth(leftMonth, -1))}
            aria-label={`Previous month (${side})`}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <p className="text-[13px] font-medium text-[#d9d9d9]">{monthHeading(month)}</p>
          <button
            type="button"
            className="focus-ring rounded-[2px] p-1 text-[#8e919e] hover:bg-[#2c2f38]"
            onClick={() => setLeftMonth(shiftMonth(leftMonth, 1))}
            aria-label={`Next month (${side})`}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mb-1 grid grid-cols-7">
          {weekDayLabels.map((day) => (
            <span key={`${side}-${day}`} className="py-1 text-center text-[11px] font-medium text-[#6b6e75]">
              {day}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {cells.map((cell) => {
            const isToday = cell.key === todayKey;
            const isStart = preview.startKey === cell.key;
            const isEnd = preview.endKey === cell.key;
            const isInRange = inPreviewRange(cell.key, preview.startKey, preview.endKey);
            const isSingleDay = isStart && isEnd;

            return (
              <button
                key={cell.key}
                type="button"
                disabled={!cell.inMonth}
                onMouseEnter={() => {
                  if (selectingEnd && cell.inMonth) {
                    setHoverKey(cell.key);
                  }
                }}
                onMouseLeave={() => {
                  if (selectingEnd) {
                    setHoverKey(null);
                  }
                }}
                onClick={() => {
                  if (cell.inMonth) {
                    handleDayClick(cell);
                  }
                }}
                className={cn(
                  "h-7 px-1 text-center text-[12px]",
                  cell.inMonth ? "cursor-pointer text-[#c2c3c6] hover:bg-[#2c2f38]" : "cursor-default text-[#44474f]",
                  isToday && !isStart && !isEnd ? "font-semibold text-[#f56c19]" : ""
                )}
                style={{
                  background:
                    isStart || isEnd
                      ? "#f56c19"
                      : isInRange
                        ? "rgba(245,108,25,0.12)"
                        : "transparent",
                  color: isStart || isEnd ? "#ffffff" : undefined,
                  borderRadius: isSingleDay
                    ? "2px"
                    : isStart
                      ? "2px 0 0 2px"
                      : isEnd
                        ? "0 2px 2px 0"
                        : "0",
                }}
              >
                {cell.day}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={toggleDropdown}
        className="focus-ring inline-flex items-center rounded-[2px] border border-[#34373f] bg-[#22252b] px-[10px] py-[5px] text-[12px] text-[#d9d9d9]"
      >
        <span className="inline-flex items-center gap-[6px]">
          <CalendarDays className="h-3.5 w-3.5" />
          <span>{activeRange.label}</span>
        </span>
        <span className="mx-[8px] h-4 w-px bg-[#34373f]" />
        <span className="inline-flex items-center">
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open ? "rotate-180" : "")} />
        </span>
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+6px)] z-[1000] w-[730px] rounded-[2px] border border-[#34373f] bg-[#22252b] shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
          <div className="grid grid-cols-[210px_1fr]">
            <div className="border-r border-[#34373f]">
              <div className="border-b border-[#34373f] px-3 py-2 text-[11px] uppercase tracking-[0.06em] text-[#6b6e75]">
                Quick ranges
              </div>

              <div className="py-1">
                {rollingQuickRanges.map((item) => {
                  const active = activeRange.quickRangeKey === item.key && activeRange.timeZone === selectedTimeZone;

                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => applyQuickRange(item.key)}
                      className={cn(
                        "focus-ring flex w-full items-center justify-between px-3 py-[7px] text-left text-[12.5px]",
                        active
                          ? "bg-[rgba(245,108,25,0.12)] text-[#f56c19]"
                          : "text-[#c2c3c6] hover:bg-[#2c2f38] hover:text-[#ffffff]"
                      )}
                    >
                      <span>{item.label}</span>
                      {active ? <Check className="h-3.5 w-3.5" /> : null}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-[14px_16px]">
              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1">
                  <span className="text-[11px] text-[#6b6e75]">From</span>
                  <input
                    value={fromInput}
                    onChange={(event) => handleFromInputChange(event.target.value)}
                    className="focus-ring rounded-[2px] border border-[#34373f] bg-[#111217] px-[9px] py-[6px] text-[12.5px] text-[#d9d9d9]"
                    placeholder="now-24h"
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-[11px] text-[#6b6e75]">To</span>
                  <input
                    value={toInput}
                    onChange={(event) => handleToInputChange(event.target.value)}
                    className="focus-ring rounded-[2px] border border-[#34373f] bg-[#111217] px-[9px] py-[6px] text-[12.5px] text-[#d9d9d9]"
                    placeholder="now"
                  />
                </label>
              </div>

              {error ? <p className="mt-2 text-[11px] text-[#f55f3e]">{error}</p> : null}

              <div className="mt-3 flex gap-3">
                {renderCalendar(leftMonth, leftCells, "left")}
                {renderCalendar(rightMonth, rightCells, "right")}
              </div>

              <div className="mt-3 border-t border-[#34373f] pt-3">
                <div className="flex items-end justify-between gap-3">
                  <div className="space-y-1.5">
                    <label className="grid gap-1">
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-[#6b6e75]">
                        <Globe className="h-3 w-3" />
                        <span>{formatTimeZoneIndicator(selectedTimeZone)}</span>
                      </span>
                      <select
                        aria-label="Time zone"
                        value={selectedTimeZone}
                        onChange={(event) => handleTimeZoneChange(event.target.value)}
                        className="focus-ring min-h-7 rounded-[2px] border border-[#34373f] bg-[#111217] px-2 text-[12px] text-[#d9d9d9]"
                      >
                        {timeZoneOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={cancel}
                      className="focus-ring rounded-[2px] border border-[#34373f] bg-transparent px-[14px] py-[5px] text-[12.5px] text-[#8e919e]"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={applyManualRange}
                      className="focus-ring rounded-[2px] border border-[#f56c19] bg-[#f56c19] px-[14px] py-[5px] text-[12.5px] font-medium text-white"
                    >
                      Apply time range
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
