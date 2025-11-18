import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MonthlyReport } from "@shared/schema";
import { CalendarDays, TrendingUp, TrendingDown, PiggyBank, Target, CreditCard, LineChart } from "lucide-react";
import { format } from "date-fns";

export default function MonthlyReportsPage() {
  const { data: reports, isLoading } = useQuery<MonthlyReport[]>({
    queryKey: ["/api/monthly-reports"],
  });

  // Default to the most recent report
  const [selectedReportId, setSelectedReportId] = useState<string>("");

  // Update selected report when data loads
  useEffect(() => {
    if (reports && reports.length > 0 && !selectedReportId) {
      setSelectedReportId(reports[0].id.toString());
    }
  }, [reports, selectedReportId]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-64" data-testid="loading-reports">Loading...</div>;
  }

  if (!reports || reports.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Monthly Reports</h1>
          <p className="text-muted-foreground">Historical overview of your monthly finances</p>
        </div>
        <Card data-testid="empty-state-reports">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CalendarDays className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground" data-testid="text-empty-message">No monthly reports yet</p>
            <p className="text-sm text-muted-foreground mt-2" data-testid="text-empty-hint">
              Close your first month to generate a report
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(num);
  };

  const formatMonth = (month: number, year: number) => {
    const date = new Date(year, month - 1);
    return format(date, 'MMMM yyyy');
  };

  const parseCategoryBreakdown = (breakdown: string) => {
    try {
      return JSON.parse(breakdown);
    } catch {
      return {};
    }
  };

  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Filter to show only the selected report
  const selectedReport = reports?.find(r => r.id.toString() === selectedReportId);

  // Calculate values for selected report
  const reportData = useMemo(() => {
    if (!selectedReport) return null;
    
    const categoryBreakdown = parseCategoryBreakdown(selectedReport.categoryBreakdown);
    const totalIncome = parseFloat(selectedReport.totalIncome);
    const totalExpenses = parseFloat(selectedReport.totalExpenses);
    const netSavings = totalIncome - totalExpenses;

    return {
      report: selectedReport,
      categoryBreakdown,
      totalIncome,
      totalExpenses,
      netSavings,
    };
  }, [selectedReport]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Monthly Reports</h1>
          <p className="text-muted-foreground">Historical overview of your monthly finances</p>
        </div>
        
        {reports && reports.length > 0 && (
          <div className="w-64">
            <Select value={selectedReportId} onValueChange={setSelectedReportId}>
              <SelectTrigger data-testid="select-month-year">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {reports.map((report) => (
                  <SelectItem key={report.id} value={report.id.toString()} data-testid={`select-option-${report.id}`}>
                    {formatMonth(report.month, report.year)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {reportData && (
              <Card key={reportData.report.id} data-testid={`card-report-${reportData.report.id}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5" />
                  {formatMonth(reportData.report.month, reportData.report.year)}
                </CardTitle>
                <CardDescription>
                  Budget utilization: <span data-testid={`text-budget-utilization-${reportData.report.id}`}>{parseFloat(reportData.report.budgetUtilization).toFixed(1)}%</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Financial Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <TrendingUp className="h-4 w-4" />
                      <span>Total Income</span>
                    </div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-500" data-testid={`text-income-${reportData.report.id}`}>
                      {formatCurrency(reportData.report.totalIncome)}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <TrendingDown className="h-4 w-4" />
                      <span>Total Expenses</span>
                    </div>
                    <div className="text-2xl font-bold text-red-600 dark:text-red-500" data-testid={`text-expenses-${reportData.report.id}`}>
                      {formatCurrency(reportData.report.totalExpenses)}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <PiggyBank className="h-4 w-4" />
                      <span>Net Savings</span>
                    </div>
                    <div 
                      className={`text-2xl font-bold ${reportData.netSavings >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}
                      data-testid={`text-savings-${reportData.report.id}`}
                    >
                      {formatCurrency(reportData.netSavings)}
                    </div>
                  </div>
                </div>

                {/* Budget Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-muted-foreground">Budget Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Budgeted Amount:</span>
                        <span className="font-medium" data-testid={`text-budgeted-${reportData.report.id}`}>{formatCurrency(reportData.report.budgetedAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Unused Budget:</span>
                        <span className="font-medium" data-testid={`text-unused-${reportData.report.id}`}>{formatCurrency(reportData.report.unusedBudget)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Savings Amount:</span>
                        <span className="font-medium" data-testid={`text-savings-amount-${reportData.report.id}`}>{formatCurrency(reportData.report.savingsAmount)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-muted-foreground">Allocations</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <Target className="h-4 w-4" />
                          Goals Contributed:
                        </span>
                        <span className="font-medium" data-testid={`text-goals-${reportData.report.id}`}>{formatCurrency(reportData.report.goalsContributed)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <LineChart className="h-4 w-4" />
                          Investments Added:
                        </span>
                        <span className="font-medium" data-testid={`text-investments-${reportData.report.id}`}>{formatCurrency(reportData.report.investmentsAdded)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <CreditCard className="h-4 w-4" />
                          Installments Paid:
                        </span>
                        <span className="font-medium" data-testid={`text-installments-paid-${reportData.report.id}`}>{formatCurrency(reportData.report.installmentsPaid)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Category Breakdown */}
                {Object.keys(reportData.categoryBreakdown).length > 0 && (
                  <div className="pt-4 border-t">
                    <h4 className="font-semibold text-sm text-muted-foreground mb-3">Category Spending</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {Object.entries(reportData.categoryBreakdown).map(([category, amount]) => {
                        const categorySlug = slugify(category);
                        return (
                          <div key={category} className="bg-muted/50 rounded-md p-3" data-testid={`category-${categorySlug}-${reportData.report.id}`}>
                            <div className="text-xs text-muted-foreground capitalize mb-1">{category}</div>
                            <div className="text-sm font-semibold" data-testid={`text-category-amount-${categorySlug}-${reportData.report.id}`}>{formatCurrency(amount as number)}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
      )}
    </div>
  );
}
