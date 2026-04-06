"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  usePeriodFilter,
  type PeriodPreset,
} from "@/lib/context/period-filter-context";

const PERIOD_OPTIONS: { value: PeriodPreset; label: string }[] = [
  { value: "current-month", label: "Current Month" },
  { value: "last-month", label: "Last Month" },
  { value: "last-3-months", label: "Last 3 Months" },
  { value: "last-6-months", label: "Last 6 Months" },
];

export function PeriodSelector() {
  const { preset, setPreset } = usePeriodFilter();

  return (
    <Select value={preset} onValueChange={(val) => setPreset(val as PeriodPreset)}>
      <SelectTrigger>
        <SelectValue placeholder="Select period" />
      </SelectTrigger>
      <SelectContent>
        {PERIOD_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
