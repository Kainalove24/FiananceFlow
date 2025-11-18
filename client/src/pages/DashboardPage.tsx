import { MetricCard } from "@/components/MetricCard";
import { CategoryPieChart } from "@/components/CategoryPieChart";
import { MonthlySpendingChart } from "@/components/MonthlySpendingChart";
import { AccountCard } from "@/components/AccountCard";
import { InstallmentCard } from "@/components/InstallmentCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Wallet, TrendingDown, Target, PiggyBank } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Account, Installment, Investment, Goal, Budget } from "@shared/schema";
import { format } from "date-fns";

export default function DashboardPage() {
  const { data: accounts } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
  });

  const { data: installments } = useQuery<Installment[]>({
    queryKey: ["/api/installments"],
  });

  const { data: investments } = useQuery<Investment[]>({
    queryKey: ["/api/investments"],
  });

  const { data: goals } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
  });

  const { data: budgets } = useQuery<Budget[]>({
    queryKey: ["/api/budgets"],
  });

  const { data: stats } = useQuery<any>({
    queryKey: ["/api/dashboard/stats"],
  });

  const totalBalance = stats?.totalBalance || 0;
  const totalIncome = stats?.totalIncome || 0;
  const totalExpenses = stats?.totalExpenses || 0;
  const remainingBudget = stats?.remainingBudget || 0;
  const incomeTrend = stats?.incomeTrend || 0;
  const expensesTrend = stats?.expensesTrend || 0;

  // Calculate investment metrics
  const totalInvestmentValue = investments?.reduce((sum, inv) => sum + parseFloat(inv.currentValue), 0) || 0;
  const totalInvestmentInitial = investments?.reduce((sum, inv) => sum + parseFloat(inv.initialAmount), 0) || 0;
  const totalInvestmentReturns = totalInvestmentValue - totalInvestmentInitial;
  const investmentReturnsPercentage = totalInvestmentInitial > 0 ? (totalInvestmentReturns / totalInvestmentInitial) * 100 : 0;

  // Calculate savings rate from current budget
  const currentBudget = budgets?.find(b => b.status === 'active');
  const savingsRate = currentBudget ? parseFloat(currentBudget.savingsRate) : 0;
  const monthlySalary = currentBudget ? parseFloat(currentBudget.monthlySalary) : 0;
  const plannedSavings = (monthlySalary * savingsRate) / 100;

  // Calculate total goals progress
  const activeGoals = goals?.filter(g => {
    const current = parseFloat(g.currentAmount);
    const target = parseFloat(g.targetAmount);
    return current < target;
  }) || [];
  const totalGoalsTarget = activeGoals.reduce((sum, g) => sum + parseFloat(g.targetAmount), 0);
  const totalGoalsCurrent = activeGoals.reduce((sum, g) => sum + parseFloat(g.currentAmount), 0);
  const goalsProgress = totalGoalsTarget > 0 ? (totalGoalsCurrent / totalGoalsTarget) * 100 : 0;

  // Use real data from stats API
  const categoryData = stats?.categoryData || [];
  const monthlyData = stats?.monthlyData || [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your financial status</p>
      </div>

      <Card className="bg-primary text-primary-foreground">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Total Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold font-mono" data-testid="text-total-balance">
            ₱{totalBalance.toFixed(2)}
          </div>
          <p className="text-sm opacity-90 mt-2">Across all accounts</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          title="Total Income"
          value={totalIncome.toFixed(2)}
          trend={{ value: parseFloat(incomeTrend.toFixed(2)), isPositive: incomeTrend >= 0 }}
          icon={TrendingUp}
          data-testid="card-total-income"
        />
        <MetricCard
          title="Total Expenses"
          value={totalExpenses.toFixed(2)}
          trend={{ value: parseFloat(expensesTrend.toFixed(2)), isPositive: expensesTrend < 0 }}
          icon={TrendingDown}
          data-testid="card-total-expenses"
        />
        <MetricCard
          title="Remaining Budget"
          value={remainingBudget.toFixed(2)}
          icon={Wallet}
          data-testid="card-remaining-budget"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          title="Investment Portfolio"
          value={totalInvestmentValue.toFixed(2)}
          trend={{ value: parseFloat(investmentReturnsPercentage.toFixed(2)), isPositive: totalInvestmentReturns >= 0 }}
          icon={TrendingUp}
          data-testid="card-investment-portfolio"
        />
        <MetricCard
          title="Savings Rate"
          value={`${savingsRate.toFixed(1)}%`}
          icon={PiggyBank}
          data-testid="card-savings-rate"
        />
        <MetricCard
          title="Goals Progress"
          value={`${goalsProgress.toFixed(1)}%`}
          icon={Target}
          data-testid="card-goals-progress"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryPieChart data={categoryData} />
        <MonthlySpendingChart data={monthlyData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Active Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeGoals.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8" data-testid="text-no-goals">
                No active goals. Set your first savings goal to get started!
              </p>
            ) : (
              <div className="space-y-4">
                {activeGoals.map((goal) => {
                  const current = parseFloat(goal.currentAmount);
                  const target = parseFloat(goal.targetAmount);
                  const progress = (current / target) * 100;
                  const daysUntilDeadline = Math.ceil(
                    (new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                  );

                  return (
                    <div key={goal.id} className="space-y-2" data-testid={`goal-${goal.id}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium" data-testid={`text-goal-name-${goal.id}`}>{goal.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(current)} of {formatCurrency(target)}
                            {daysUntilDeadline > 0 && (
                              <span className="ml-2">• {daysUntilDeadline} days left</span>
                            )}
                            {daysUntilDeadline <= 0 && (
                              <span className="ml-2 text-red-600">• Deadline passed</span>
                            )}
                          </p>
                        </div>
                        <span className="text-sm font-semibold" data-testid={`text-goal-progress-${goal.id}`}>
                          {progress.toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={progress} className="h-2" data-testid={`progress-goal-${goal.id}`} />
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Installments</CardTitle>
          </CardHeader>
          <CardContent>
            {installments?.filter(i => i.status === "active").length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8" data-testid="text-no-installments">
                No active installments
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {installments?.filter(i => i.status === "active").map((installment) => (
                  <InstallmentCard
                    key={installment.id}
                    id={installment.id}
                    name={installment.name}
                    monthlyAmount={parseFloat(installment.monthlyAmount)}
                    monthsPaid={installment.monthsPaid}
                    term={installment.term}
                    status={installment.status}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Account Balances</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {accounts?.map((account) => (
            <AccountCard
              key={account.id}
              id={account.id}
              name={account.name}
              type={account.type}
              balance={parseFloat(account.balance)}
              creditLimit={account.creditLimit ? parseFloat(account.creditLimit) : undefined}
              onEdit={(id) => console.log("Edit account", id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
