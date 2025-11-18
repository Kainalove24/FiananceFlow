import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, TrendingUp, AlertTriangle, CheckCircle, CalendarIcon, Target, CreditCard, FileWarning } from "lucide-react";
import { format } from "date-fns";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Budget, Goal, Installment, Account, BudgetCategory } from "@shared/schema";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

type PaymentType = "one-time" | "installment";

interface InstallmentOption {
  label: string;
  term: number;
  monthlyPayment: number;
  surplusUsed: number;
  percentageUsed: number;
  affordabilityLevel: 'best' | 'good' | 'risky' | 'not-recommended' | 'not-possible';
}

export default function SimulationPage() {
  const [purchaseName, setPurchaseName] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [paymentType, setPaymentType] = useState<PaymentType>("one-time");
  const [hasSimulated, setHasSimulated] = useState(false);
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [isInstallmentDialogOpen, setIsInstallmentDialogOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<InstallmentOption | null>(null);
  const [goalDeadline, setGoalDeadline] = useState<Date>(new Date());
  const [installmentStartDate, setInstallmentStartDate] = useState<Date>(new Date());
  const [installmentAccountId, setInstallmentAccountId] = useState("");
  const { toast } = useToast();

  const { data: budgets } = useQuery<Budget[]>({
    queryKey: ["/api/budgets"],
  });

  const { data: goals } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
  });

  const { data: installments } = useQuery<Installment[]>({
    queryKey: ["/api/installments"],
  });

  const { data: accounts } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
  });

  const { data: budgetCategories } = useQuery<BudgetCategory[]>({
    queryKey: ["/api/budget-categories"],
  });

  const createGoalMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/goals", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      toast({ title: "Goal created successfully from simulation!" });
      setIsGoalDialogOpen(false);
      setTimeout(handleReset, 300);
    },
    onError: () => {
      toast({ title: "Failed to create goal", variant: "destructive" });
    },
  });

  const createInstallmentMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/installments", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/installments"] });
      toast({ title: "Installment created successfully from simulation!" });
      setIsInstallmentDialogOpen(false);
      setTimeout(handleReset, 300);
    },
    onError: () => {
      toast({ title: "Failed to create installment", variant: "destructive" });
    },
  });

  // Get the latest budget
  const latestBudget = budgets?.[budgets.length - 1];

  // Calculate financial metrics
  const analysis = useMemo(() => {
    if (!latestBudget || !purchasePrice) return null;

    const price = parseFloat(purchasePrice);
    const salary = parseFloat(latestBudget.monthlySalary);
    // Calculate fixed expenses from budget categories
    const fixedExpenses = budgetCategories?.reduce((sum, cat) => sum + parseFloat(cat.budgetedAmount), 0) || 0;
    const savingsRate = parseFloat(latestBudget.savingsRate) / 100; // Convert percentage to decimal
    
    // Calculate current obligations
    const activeInstallments = installments?.filter(i => i.status === "active") || [];
    const totalInstallments = activeInstallments.reduce(
      (sum, inst) => sum + parseFloat(inst.monthlyAmount),
      0
    );

    // Calculate monthly goal contributions
    const activeGoals = goals?.filter(g => {
      const deadline = new Date(g.deadline);
      const now = new Date();
      return deadline > now;
    }) || [];

    const totalGoalContributions = activeGoals.reduce((sum, goal) => {
      const remaining = parseFloat(goal.targetAmount) - parseFloat(goal.currentAmount);
      const deadline = new Date(goal.deadline);
      const now = new Date();
      const monthsRemaining = Math.max(
        1,
        (deadline.getFullYear() - now.getFullYear()) * 12 +
          deadline.getMonth() - now.getMonth()
      );
      return sum + remaining / monthsRemaining;
    }, 0);

    // Calculate monthly surplus
    const targetSavings = salary * savingsRate;
    const monthlySurplus = salary - fixedExpenses - totalInstallments - totalGoalContributions - targetSavings;

    // Calculate total balance available
    const totalBalance = accounts?.reduce((sum, acc) => sum + parseFloat(acc.balance), 0) || 0;

    return {
      price,
      salary,
      fixedExpenses,
      totalInstallments,
      totalGoalContributions,
      targetSavings,
      monthlySurplus,
      totalBalance,
      canAffordNow: totalBalance >= price,
      monthsToSave: monthlySurplus > 0 ? Math.ceil(price / monthlySurplus) : Infinity,
    };
  }, [latestBudget, purchasePrice, installments, goals, accounts, budgetCategories]);

  // Generate installment options with affordability-based recommendations
  // Best: ONLY the shortest term below 20% of surplus (the sweet spot)
  // Good: Other terms below 20% of surplus (fiscally prudent but not optimal)
  // Risky: Monthly payment 20-50% of surplus (manageable but tight)
  // Not Recommended: Monthly payment 50-100% of surplus (very tight budget)
  // Not Possible: Monthly payment > 100% of surplus (exceeds available funds)
  const installmentOptions = useMemo((): InstallmentOption[] => {
    if (!analysis || paymentType !== "installment") return [];

    const { price, monthlySurplus } = analysis;
    const options: InstallmentOption[] = [];
    
    // Specific term recommendations: 3, 6, 12, 18, 24, 36 months
    const terms = [3, 6, 12, 18, 24, 36];

    // First pass: categorize all options
    const categorizedOptions = terms.map((term) => {
      const monthlyPayment = price / term;
      const percentageUsed = monthlySurplus > 0 ? (monthlyPayment / monthlySurplus) * 100 : Infinity;
      
      return {
        term,
        monthlyPayment,
        percentageUsed,
      };
    });

    // Find the shortest term below 20% (this will be "best")
    const shortestBelow20 = categorizedOptions.find(opt => opt.percentageUsed < 20);

    // Second pass: assign affordability levels and labels
    categorizedOptions.forEach(({ term, monthlyPayment, percentageUsed }) => {
      let affordabilityLevel: 'best' | 'good' | 'risky' | 'not-recommended' | 'not-possible';
      let label = `${term} months`;
      
      if (percentageUsed < 20) {
        // Only the shortest term below 20% is "best", others are "good"
        if (shortestBelow20 && term === shortestBelow20.term) {
          affordabilityLevel = 'best';
          label = `Best (${term} mo)`;
        } else {
          affordabilityLevel = 'good';
          label = `Good (${term} mo)`;
        }
      } else if (percentageUsed <= 50) {
        affordabilityLevel = 'risky';
        label = `Risky (${term} mo)`;
      } else if (percentageUsed <= 100) {
        affordabilityLevel = 'not-recommended';
        label = `Not recommended (${term} mo)`;
      } else {
        affordabilityLevel = 'not-possible';
        label = `Not possible (${term} mo)`;
      }
      
      options.push({
        label,
        term,
        monthlyPayment,
        surplusUsed: monthlyPayment,
        percentageUsed,
        affordabilityLevel,
      });
    });

    return options;
  }, [analysis, paymentType]);

  // Find the best option: the single option marked as "best" (shortest term below 20%)
  // If even 36 months exceeds 20%, recommend saving instead
  const bestOption = useMemo(() => {
    const bestOpt = installmentOptions.find(opt => opt.affordabilityLevel === 'best');
    return bestOpt || null;
  }, [installmentOptions]);

  // Check if even the longest term (36 months) exceeds 20% of surplus
  const shouldSaveInstead = useMemo(() => {
    if (!installmentOptions.length) return false;
    const longestTerm = installmentOptions[installmentOptions.length - 1];
    return longestTerm.percentageUsed >= 20;
  }, [installmentOptions]);

  // Affordability assessment
  const affordability = useMemo(() => {
    if (!analysis) return null;

    if (paymentType === "one-time") {
      if (analysis.canAffordNow) {
        if (analysis.monthsToSave < Infinity) {
          return {
            status: "good" as const,
            message: `You can afford this now! Or save up in ${analysis.monthsToSave} month${analysis.monthsToSave > 1 ? 's' : ''} if needed.`,
            icon: CheckCircle,
          };
        }
        return {
          status: "good" as const,
          message: "You can afford this purchase now with your current balance!",
          icon: CheckCircle,
        };
      } else if (analysis.monthsToSave <= 3) {
        return {
          status: "warning" as const,
          message: `Not enough balance now. Save for ${analysis.monthsToSave} month${analysis.monthsToSave > 1 ? 's' : ''} at ₱${analysis.monthlySurplus.toFixed(2)}/mo`,
          icon: AlertTriangle,
        };
      } else if (analysis.monthsToSave < Infinity) {
        return {
          status: "caution" as const,
          message: `This will take ${analysis.monthsToSave} months to save for at ₱${analysis.monthlySurplus.toFixed(2)}/mo`,
          icon: AlertTriangle,
        };
      } else {
        return {
          status: "bad" as const,
          message: "Not feasible with current budget - no monthly surplus available",
          icon: AlertTriangle,
        };
      }
    } else {
      // Installment
      if (analysis.monthlySurplus <= 0) {
        return {
          status: "bad" as const,
          message: "Warning: No surplus available. Installments will exceed budget.",
          icon: AlertTriangle,
        };
      } else if (shouldSaveInstead) {
        return {
          status: "caution" as const,
          message: "Consider saving instead - even 36 months exceeds 20% of your surplus",
          icon: FileWarning,
        };
      } else if (bestOption && bestOption.affordabilityLevel === 'best') {
        return {
          status: "good" as const,
          message: "Affordable with installment plan",
          icon: CheckCircle,
        };
      } else {
        return {
          status: "warning" as const,
          message: "No optimal installment option - consider saving",
          icon: AlertTriangle,
        };
      }
    }
  }, [analysis, paymentType, bestOption, shouldSaveInstead]);

  // Chart data for budget visualization
  const chartData = useMemo(() => {
    if (!analysis) return [];

    const current = {
      name: "Current",
      "Fixed Expenses": analysis.fixedExpenses,
      "Installments": analysis.totalInstallments,
      "Goal Savings": analysis.totalGoalContributions,
      "Target Savings": analysis.targetSavings,
      "Surplus": analysis.monthlySurplus,
    };

    if (paymentType === "one-time") {
      return [current];
    } else {
      // Show impact of best option
      if (!bestOption) return [current];

      const withPurchase = {
        name: "With Purchase",
        "Fixed Expenses": analysis.fixedExpenses,
        "Installments": analysis.totalInstallments + bestOption.monthlyPayment,
        "Goal Savings": analysis.totalGoalContributions,
        "Target Savings": analysis.targetSavings,
        "Surplus": analysis.monthlySurplus - bestOption.monthlyPayment,
      };

      return [current, withPurchase];
    }
  }, [analysis, paymentType, bestOption]);

  const handleSimulate = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSimulated(true);
  };

  const handleReset = () => {
    setPurchaseName("");
    setPurchasePrice("");
    setPaymentType("one-time");
    setHasSimulated(false);
  };

  const handleAddAsGoal = () => {
    if (analysis?.monthsToSave && analysis.monthsToSave < Infinity) {
      const deadline = new Date();
      // Cap at 10 years maximum (120 months) for realistic goal setting
      const cappedMonths = Math.min(analysis.monthsToSave, 120);
      const yearsToAdd = Math.floor(cappedMonths / 12);
      const monthsToAdd = Math.round(cappedMonths % 12);
      deadline.setFullYear(deadline.getFullYear() + yearsToAdd);
      deadline.setMonth(deadline.getMonth() + monthsToAdd);
      setGoalDeadline(deadline);
    } else {
      // Default to 1 year from now if can afford immediately or no analysis
      const deadline = new Date();
      deadline.setFullYear(deadline.getFullYear() + 1);
      setGoalDeadline(deadline);
    }
    setIsGoalDialogOpen(true);
  };

  const handleAddAsInstallment = (option: InstallmentOption) => {
    setSelectedOption(option);
    setIsInstallmentDialogOpen(true);
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    createGoalMutation.mutate({
      name: purchaseName,
      targetAmount: parseFloat(purchasePrice).toFixed(2),
      currentAmount: "0.00",
      deadline: goalDeadline,
    });
  };

  const handleCreateInstallment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOption || !installmentAccountId) return;
    createInstallmentMutation.mutate({
      name: purchaseName,
      monthlyAmount: selectedOption.monthlyPayment.toFixed(2),
      term: selectedOption.term,
      startDate: installmentStartDate,
      accountId: parseInt(installmentAccountId),
    });
  };


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Purchase Simulator</h1>
        <p className="text-muted-foreground">
          See if a purchase fits your budget and get payment recommendations
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Purchase Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSimulate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="purchaseName">What do you want to buy?</Label>
              <Input
                id="purchaseName"
                placeholder="e.g., New Laptop"
                required
                value={purchaseName}
                onChange={(e) => setPurchaseName(e.target.value)}
                data-testid="input-purchase-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchasePrice">Price</Label>
              <Input
                id="purchasePrice"
                type="number"
                step="0.01"
                placeholder="0.00"
                required
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                data-testid="input-purchase-price"
              />
            </div>

            <div className="space-y-2">
              <Label>Payment Type</Label>
              <RadioGroup value={paymentType} onValueChange={(v) => setPaymentType(v as PaymentType)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="one-time" id="one-time" data-testid="radio-one-time" />
                  <Label htmlFor="one-time" className="cursor-pointer font-normal">
                    One-time payment
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="installment" id="installment" data-testid="radio-installment" />
                  <Label htmlFor="installment" className="cursor-pointer font-normal">
                    Installment plan
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1" data-testid="button-simulate">
                <TrendingUp className="w-4 h-4 mr-2" />
                Simulate
              </Button>
              {hasSimulated && (
                <Button type="button" variant="outline" onClick={handleReset} data-testid="button-reset">
                  Reset
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Empty State - No Budget */}
      {hasSimulated && !latestBudget && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileWarning className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Budget Found</h3>
            <p className="text-muted-foreground text-center mb-6">
              You need to create a budget first to use the simulation feature.
              <br />
              A budget helps calculate your monthly surplus and affordability.
            </p>
            <Button asChild data-testid="button-create-budget">
              <a href="/budget">Create Budget</a>
            </Button>
          </CardContent>
        </Card>
      )}

      {hasSimulated && analysis && affordability && (
        <>
          {/* Affordability Status */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <affordability.icon
                  className={`w-12 h-12 ${
                    affordability.status === "good"
                      ? "text-green-500"
                      : affordability.status === "warning"
                      ? "text-yellow-500"
                      : "text-red-500"
                  }`}
                />
                <div>
                  <h3 className="text-xl font-semibold">{affordability.message}</h3>
                  <p className="text-muted-foreground">
                    Purchase: {purchaseName} - ₱{parseFloat(purchasePrice).toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Current Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold font-mono">₱{analysis.totalBalance.toFixed(2)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Surplus</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold font-mono">₱{analysis.monthlySurplus.toFixed(2)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {paymentType === "one-time" ? "Months to Save" : "Best Payment Term"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold font-mono">
                  {paymentType === "one-time"
                    ? analysis.canAffordNow
                      ? "Ready!"
                      : `${analysis.monthsToSave} mo`
                    : bestOption
                    ? `${bestOption.term} mo`
                    : "N/A"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Installment Options */}
          {paymentType === "installment" && installmentOptions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recommended Payment Terms</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {installmentOptions.map((option, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border rounded-lg"
                      data-testid={`installment-option-${index}`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{option.label}</h4>
                          {option.affordabilityLevel === 'best' ? (
                            <Badge variant="default" className="text-xs" data-testid={`badge-best-${index}`}>
                              Best
                            </Badge>
                          ) : option.affordabilityLevel === 'good' ? (
                            <Badge variant="default" className="text-xs bg-emerald-500 dark:bg-emerald-600" data-testid={`badge-good-${index}`}>
                              Good
                            </Badge>
                          ) : option.affordabilityLevel === 'risky' ? (
                            <Badge variant="secondary" className="text-xs bg-yellow-500 dark:bg-yellow-600" data-testid={`badge-risky-${index}`}>
                              Risky
                            </Badge>
                          ) : option.affordabilityLevel === 'not-recommended' ? (
                            <Badge variant="outline" className="text-xs bg-orange-500/10 dark:bg-orange-600/20 border-orange-500 dark:border-orange-600 text-orange-700 dark:text-orange-400" data-testid={`badge-not-recommended-${index}`}>
                              Not Recommended
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="text-xs" data-testid={`badge-not-possible-${index}`}>
                              Not Possible
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {option.percentageUsed.toFixed(0)}% of monthly surplus
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-lg font-bold font-mono">₱{option.monthlyPayment.toFixed(2)}/mo</p>
                          <p className="text-sm text-muted-foreground">{option.term} months</p>
                        </div>
                        <Button
                          onClick={() => handleAddAsInstallment(option)}
                          size="sm"
                          data-testid={`button-add-installment-${index}`}
                        >
                          <CreditCard className="w-4 h-4 mr-2" />
                          Create
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Budget Visualization */}
          <Card>
            <CardHeader>
              <CardTitle>Budget Impact</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => `₱${Number(value).toFixed(2)}`} />
                  <Legend />
                  <Bar dataKey="Fixed Expenses" stackId="a" fill="hsl(var(--chart-1))" />
                  <Bar dataKey="Installments" stackId="a" fill="hsl(var(--chart-2))" />
                  <Bar dataKey="Goal Savings" stackId="a" fill="hsl(var(--chart-3))" />
                  <Bar dataKey="Target Savings" stackId="a" fill="hsl(var(--chart-4))" />
                  <Bar dataKey="Surplus" stackId="a" fill="hsl(var(--chart-5))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          {paymentType === "one-time" && analysis.monthsToSave < Infinity && (
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <Button onClick={handleAddAsGoal} className="w-full" data-testid="button-add-as-goal">
                  <Target className="w-4 h-4 mr-2" />
                  Create Savings Goal
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Add as Goal Dialog */}
      <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Savings Goal</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateGoal} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="goalName">Goal Name</Label>
              <Input id="goalName" value={purchaseName} readOnly data-testid="input-goal-name" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="goalAmount">Target Amount</Label>
              <Input
                id="goalAmount"
                value={`₱${parseFloat(purchasePrice).toFixed(2)}`}
                readOnly
                data-testid="input-goal-amount"
              />
            </div>

            <div className="space-y-2">
              <Label>Deadline</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start" data-testid="button-goal-deadline">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(goalDeadline, "MMM dd, yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={goalDeadline} onSelect={(d) => d && setGoalDeadline(d)} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                className="flex-1"
                disabled={createGoalMutation.isPending}
                data-testid="button-submit-goal"
              >
                {createGoalMutation.isPending ? "Creating..." : "Create Goal"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsGoalDialogOpen(false)}
                data-testid="button-cancel-goal"
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add as Installment Dialog */}
      <Dialog open={isInstallmentDialogOpen} onOpenChange={setIsInstallmentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Installment Plan</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateInstallment} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="installmentName">Installment Name</Label>
              <Input id="installmentName" value={purchaseName} readOnly data-testid="input-installment-name" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="installmentAmount">Monthly Payment</Label>
                <Input
                  id="installmentAmount"
                  value={selectedOption ? `₱${selectedOption.monthlyPayment.toFixed(2)}` : ""}
                  readOnly
                  data-testid="input-installment-amount"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="installmentTerm">Term</Label>
                <Input
                  id="installmentTerm"
                  value={selectedOption ? `${selectedOption.term} months` : ""}
                  readOnly
                  data-testid="input-installment-term"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    data-testid="button-installment-start-date"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(installmentStartDate, "MMM dd, yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={installmentStartDate}
                    onSelect={(d) => d && setInstallmentStartDate(d)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="installmentAccount">Payment Account</Label>
              <Select required value={installmentAccountId} onValueChange={setInstallmentAccountId}>
                <SelectTrigger data-testid="select-installment-account">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts?.map((account) => (
                    <SelectItem key={account.id} value={account.id.toString()}>
                      {account.name} - ₱{parseFloat(account.balance).toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                className="flex-1"
                disabled={createInstallmentMutation.isPending || !installmentAccountId}
                data-testid="button-submit-installment"
              >
                {createInstallmentMutation.isPending ? "Creating..." : "Create Installment"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsInstallmentDialogOpen(false)}
                data-testid="button-cancel-installment"
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
