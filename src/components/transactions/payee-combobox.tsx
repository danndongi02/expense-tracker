"use client";

import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";

interface PayeeComboboxProps {
  value: string;
  onChange: (value: string) => void;
  payees: string[];
  placeholder?: string;
}

export function PayeeCombobox({
  value,
  onChange,
  payees,
  placeholder = "e.g. Naivas, Safaricom, Equity Bank",
}: PayeeComboboxProps) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const query = value.toLowerCase().trim();
  const filtered = query
    ? payees.filter((p) => p.toLowerCase().includes(query))
    : payees;

  const exactMatch = payees.some((p) => p.toLowerCase() === query);
  const showAddNew = value.trim().length > 0 && !exactMatch;
  const showDropdown = open && (filtered.length > 0 || showAddNew);

  function handleSelect(payee: string) {
    onChange(payee);
    setOpen(false);
    inputRef.current?.blur();
  }

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
          if (e.key === "Enter") e.preventDefault();
        }}
        placeholder={placeholder}
        autoComplete="off"
      />
      {showDropdown && (
        <div
          className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md"
          onMouseDown={(e) => e.preventDefault()}
        >
          <div className="max-h-60 overflow-y-auto p-1">
            {filtered.map((p) => (
              <button
                key={p}
                type="button"
                className="w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-muted"
                onClick={() => handleSelect(p)}
              >
                {p}
              </button>
            ))}
            {showAddNew && (
              <button
                type="button"
                className="w-full rounded-sm px-2 py-1.5 text-left text-sm text-muted-foreground hover:bg-muted"
                onClick={() => handleSelect(value.trim())}
              >
                Use &quot;{value.trim()}&quot;
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
