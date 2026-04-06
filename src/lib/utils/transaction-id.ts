export function formatTransactionId(sequence: number): string {
  return `TX-${String(sequence).padStart(6, "0")}`;
}
