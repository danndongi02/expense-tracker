import { Transaction } from "@/lib/types";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/date";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ReversalConfirmDialogProps {
  transaction: Transaction | null;
  onConfirm: () => void;
  onClose: () => void;
  isSubmitting: boolean;
}

function computeReversalEffect(tx: Transaction): { accountName: string; delta: number }[] {
  switch (tx.type) {
    case "Expense":
      return [{ accountName: tx.accountName, delta: tx.amount }];
    case "Income":
      return [{ accountName: tx.accountName, delta: -tx.amount }];
    case "Transfer":
    case "Investment Contribution":
      return [
        { accountName: tx.accountName, delta: tx.amount },
        { accountName: tx.toAccountName!, delta: -tx.amount },
      ];
    case "Loan Repayment":
      return [
        { accountName: tx.accountName, delta: tx.amount },
        { accountName: tx.toAccountName!, delta: tx.amount },
      ];
    case "Interest Charge":
      return [{ accountName: tx.accountName, delta: -tx.amount }];
    default:
      return [];
  }
}

export function ReversalConfirmDialog({
  transaction,
  onConfirm,
  onClose,
  isSubmitting,
}: ReversalConfirmDialogProps) {
  if (!transaction) return null;

  const effects = computeReversalEffect(transaction);

  return (
    <Dialog open={!!transaction} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Reversal</DialogTitle>
          <DialogDescription>
            You are about to reverse this transaction. This will create a new Reversal transaction and update the affected account balances.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-md border p-4 text-sm">
            <div className="grid grid-cols-[100px_1fr] gap-2">
              <span className="text-muted-foreground">ID:</span>
              <span className="font-mono">{transaction.transactionId}</span>
              <span className="text-muted-foreground">Date:</span>
              <span>{formatDate(transaction.transactionDate.toDate())}</span>
              <span className="text-muted-foreground">Type:</span>
              <span>{transaction.type}</span>
              <span className="text-muted-foreground">Description:</span>
              <span className="max-w-[300px] truncate">{transaction.description}</span>
              <span className="text-muted-foreground">Amount:</span>
              <span className="font-medium">{formatCurrency(transaction.amount)}</span>
            </div>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-medium">Account balance changes</h4>
            <div className="space-y-2 rounded-md bg-muted p-4 text-sm">
              {effects.map((effect, i) => (
                <div key={i} className="flex justify-between">
                  <span>{effect.accountName}</span>
                  <span
                    className={
                      effect.delta >= 0
                        ? "text-green-600 dark:text-green-400 font-medium"
                        : "text-red-600 dark:text-red-400 font-medium"
                    }
                  >
                    {effect.delta > 0 ? "+" : ""}
                    {formatCurrency(effect.delta)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? "Reversing..." : "Confirm Reversal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
