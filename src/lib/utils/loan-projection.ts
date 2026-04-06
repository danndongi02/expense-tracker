import { addDays, addMonths, addYears, isAfter, startOfDay } from "date-fns";
import { InterestFrequency } from "@/lib/types";

export function estimateNextInterestDate(startDate: Date, frequency: InterestFrequency): Date | null {
  const now = startOfDay(new Date());
  let nextDate = startOfDay(startDate);

  if (frequency === "None") return null;

  while (!isAfter(nextDate, now)) {
    switch (frequency) {
      case "Daily":
        nextDate = addDays(nextDate, 1);
        break;
      case "Monthly":
        nextDate = addMonths(nextDate, 1);
        break;
      case "Bi-Monthly":
        nextDate = addMonths(nextDate, 2);
        break;
      case "Quarterly":
        nextDate = addMonths(nextDate, 3);
        break;
      case "Bi-Yearly":
        nextDate = addMonths(nextDate, 6);
        break;
      case "Yearly":
        nextDate = addYears(nextDate, 1);
        break;
      default:
        return null;
    }
  }

  return nextDate;
}
