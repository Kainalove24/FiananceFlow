import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Plus, Target, Trash2, Pencil } from "lucide-react";
import { format } from "date-fns";

interface GoalCardProps {
  id: number;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: Date;
  onDeposit?: (id: number) => void;
  onDelete?: (id: number) => void;
  onEdit?: (id: number) => void;
}

export function GoalCard({ id, name, targetAmount, currentAmount, deadline, onDeposit, onDelete, onEdit }: GoalCardProps) {
  const progress = (currentAmount / targetAmount) * 100;
  const remaining = targetAmount - currentAmount;

  return (
    <Card data-testid={`card-goal-${id}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-muted-foreground" />
          <CardTitle className="text-lg font-medium">{name}</CardTitle>
        </div>
        <div className="flex gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onEdit?.(id)}
            data-testid={`button-edit-goal-${id}`}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onDelete?.(id)}
            data-testid={`button-delete-goal-${id}`}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Current</span>
              <span className="font-mono font-semibold" data-testid={`text-goal-current-${id}`}>
                ₱{currentAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Target</span>
              <span className="font-mono font-semibold" data-testid={`text-goal-target-${id}`}>
                ₱{targetAmount.toFixed(2)}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              Due: {format(deadline, "MMM dd, yyyy")}
            </p>
            <Button
              size="sm"
              onClick={() => onDeposit?.(id)}
              data-testid={`button-deposit-goal-${id}`}
            >
              <Plus className="w-4 h-4 mr-1" />
              Deposit
            </Button>
          </div>
          {remaining > 0 && (
            <p className="text-xs text-muted-foreground">
              ₱{remaining.toFixed(2)} remaining
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
