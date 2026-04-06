"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { startOfMonth } from "date-fns";

export type PeriodPreset = "current-month" | "last-month" | "last-3-months" | "last-6-months" | "custom";

interface PeriodFilterContextType {
  startDate: Date;
  endDate: Date;
  preset: PeriodPreset;
  setPreset: (preset: PeriodPreset) => void;
  setCustomRange: (start: Date, end: Date) => void;
}

const PeriodFilterContext = createContext<PeriodFilterContextType | null>(null);

function getPresetDates(preset: PeriodPreset): { start: Date; end: Date } {
  const now = new Date();
  switch (preset) {
    case "current-month":
      return { start: startOfMonth(now), end: now };
    case "last-month": {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      return { start: lastMonth, end: lastMonthEnd };
    }
    case "last-3-months":
      return { start: new Date(now.getFullYear(), now.getMonth() - 2, 1), end: now };
    case "last-6-months":
      return { start: new Date(now.getFullYear(), now.getMonth() - 5, 1), end: now };
    default:
      return { start: startOfMonth(now), end: now };
  }
}

export function PeriodFilterProvider({ children }: { children: ReactNode }) {
  const [preset, setPresetState] = useState<PeriodPreset>("current-month");
  const [startDate, setStartDate] = useState<Date>(() => startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date>(() => new Date());

  function setPreset(p: PeriodPreset) {
    setPresetState(p);
    if (p !== "custom") {
      const { start, end } = getPresetDates(p);
      setStartDate(start);
      setEndDate(end);
    }
  }

  function setCustomRange(start: Date, end: Date) {
    setPresetState("custom");
    setStartDate(start);
    setEndDate(end);
  }

  return (
    <PeriodFilterContext.Provider
      value={{ startDate, endDate, preset, setPreset, setCustomRange }}
    >
      {children}
    </PeriodFilterContext.Provider>
  );
}

export function usePeriodFilter() {
  const context = useContext(PeriodFilterContext);
  if (!context) throw new Error("usePeriodFilter must be used within PeriodFilterProvider");
  return context;
}
