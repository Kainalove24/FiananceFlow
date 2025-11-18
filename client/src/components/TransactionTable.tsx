import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface Transaction {
  id: number;
  date: Date;
  description: string;
  category: string;
  amount: number;
  type: string;
  accountName: string;
  transferGroupId?: string | null;
}

interface TransactionTableProps {
  transactions: Transaction[];
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}

const typeColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  income: "default",
  expense: "destructive",
  fixed: "secondary",
  variable: "outline",
  transfer: "outline",
};

export function TransactionTable({ transactions, onEdit, onDelete }: TransactionTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[120px]">Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Account</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                No transactions found
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((transaction) => (
              <TableRow key={transaction.id} data-testid={`row-transaction-${transaction.id}`}>
                <TableCell className="font-medium">
                  {format(transaction.date, "MMM dd, yyyy")}
                </TableCell>
                <TableCell>{transaction.description}</TableCell>
                <TableCell>{transaction.category}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {transaction.accountName}
                </TableCell>
                <TableCell>
                  <Badge variant={typeColors[transaction.transferGroupId ? "transfer" : transaction.type] || "outline"}>
                    {transaction.transferGroupId ? "transfer" : transaction.type}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono font-semibold">
                  <span className={
                    transaction.transferGroupId 
                      ? "text-foreground" 
                      : transaction.type === "income" 
                        ? "text-green-600 dark:text-green-400" 
                        : "text-red-600 dark:text-red-400"
                  }>
                    {transaction.transferGroupId 
                      ? "" 
                      : transaction.type === "income" ? "+" : "-"}₱{Math.abs(transaction.amount).toFixed(2)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onEdit?.(transaction.id)}
                      data-testid={`button-edit-transaction-${transaction.id}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onDelete?.(transaction.id)}
                      data-testid={`button-delete-transaction-${transaction.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
