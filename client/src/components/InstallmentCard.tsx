import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Trash2, Pencil, DollarSign } from "lucide-react";

interface InstallmentCardProps {
  id: number;
  name: string;
  monthlyAmount: number;
  monthsPaid: number;
  term: number;
  status: string;
  onDelete?: (id: number) => void;
  onEdit?: (id: number) => void;
  onPayment?: (id: number) => void;
}

export function InstallmentCard({ id, name, monthlyAmount, monthsPaid, term, status, onDelete, onEdit, onPayment }: InstallmentCardProps) {
  const progress = (monthsPaid / term) * 100;
  const remaining = term - monthsPaid;

  return (
    <Card data-testid={`card-installment-${id}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium">{name}</CardTitle>
        <div className="flex gap-1 items-center">
          <Badge variant={status === "active" ? "default" : "secondary"} data-testid={`badge-installment-status-${id}`}>
            {status.toUpperCase()}
          </Badge>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onEdit?.(id)}
            data-testid={`button-edit-installment-${id}`}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onDelete?.(id)}
            data-testid={`button-delete-installment-${id}`}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-2xl font-bold font-mono" data-testid={`text-installment-amount-${id}`}>
            ₱{monthlyAmount.toFixed(2)}/mo
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{monthsPaid} / {term} months</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          <p className="text-xs text-muted-foreground">
            {remaining} months remaining
          </p>
          {status === "active" && monthsPaid < term && onPayment && (
            <Button 
              onClick={() => onPayment(id)} 
              className="w-full" 
              size="sm"
              data-testid={`button-make-payment-${id}`}
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Make Payment
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
