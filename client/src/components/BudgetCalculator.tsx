import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export function BudgetCalculator() {
  const [salary, setSalary] = useState("5000");
  
  const salaryNum = parseFloat(salary) || 0;
  const fixedExpenses = 1200;
  const installments = 730;
  const savings = salaryNum * 0.2;
  const remaining = salaryNum - fixedExpenses - installments - savings;

  const handleSave = () => {
    console.log("Budget plan saved:", {
      salary: salaryNum,
      fixedExpenses,
      installments,
      savings,
      remaining,
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Income</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="salary">Monthly Salary</Label>
            <Input
              id="salary"
              type="number"
              step="0.01"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              placeholder="Enter your monthly salary"
              className="font-mono"
              data-testid="input-salary"
            />
          </div>
          <Button onClick={handleSave} className="w-full" data-testid="button-save-budget">
            Save Budget Plan
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Budget Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Income</span>
              <span className="font-mono font-semibold">₱{salaryNum.toFixed(2)}</span>
            </div>
            <Progress value={100} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Fixed Expenses</span>
              <span className="font-mono font-semibold">
                ₱{fixedExpenses.toFixed(2)} ({((fixedExpenses / salaryNum) * 100).toFixed(1)}%)
              </span>
            </div>
            <Progress value={(fixedExpenses / salaryNum) * 100} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Installments</span>
              <span className="font-mono font-semibold">
                ₱{installments.toFixed(2)} ({((installments / salaryNum) * 100).toFixed(1)}%)
              </span>
            </div>
            <Progress value={(installments / salaryNum) * 100} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Savings (20%)</span>
              <span className="font-mono font-semibold">
                ₱{savings.toFixed(2)} ({((savings / salaryNum) * 100).toFixed(1)}%)
              </span>
            </div>
            <Progress value={(savings / salaryNum) * 100} className="h-2" />
          </div>

          <div className="pt-4 border-t">
            <div className="flex justify-between">
              <span className="font-medium">Remaining Budget</span>
              <span className="font-mono font-bold text-lg text-chart-2">
                ₱{remaining.toFixed(2)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
