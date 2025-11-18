import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ArrowRightLeft } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Budget, BudgetCategory, Account } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function BudgetPlannerPage() {
  const [salary, setSalary] = useState("");
  const [isAddCategoryDialogOpen, setIsAddCategoryDialogOpen] = useState(false);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [isCloseMonthDialogOpen, setIsCloseMonthDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryAmount, setNewCategoryAmount] = useState("");
  const [editingAmounts, setEditingAmounts] = useState<Record<number, string>>({});
  const [transferSourceAccount, setTransferSourceAccount] = useState("");
  const [transferDestinationAccount, setTransferDestinationAccount] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferDescription, setTransferDescription] = useState("");
  const [allocations, setAllocations] = useState<Record<number, {
    action: 'carryover' | 'investment' | 'goal' | 'account';
    destinationId?: number;
  }>>({});
  const { toast } = useToast();

  const { data: currentBudget } = useQuery<Budget | null>({
    queryKey: ["/api/budgets/current"],
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Array<{
    id: number;
    name: string;
    budgetedAmount: number;
    spentAmount: number;
    percentUsed: number;
    colorIndicator: 'green' | 'yellow' | 'red';
    isPredefined: string;
  }>>({
    queryKey: ["/api/budget-categories/usage"],
  });

  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
  });

  const { data: goals = [] } = useQuery<any[]>({
    queryKey: ["/api/goals"],
  });

  const { data: investments = [] } = useQuery<any[]>({
    queryKey: ["/api/investments"],
  });

  const createBudgetMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/budgets", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budgets/current"] });
      toast({ title: "Budget plan saved successfully" });
    },
    onError: () => {
      toast({ title: "Failed to save budget plan", variant: "destructive" });
    },
  });

  const updateBudgetMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/budgets/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budgets/current"] });
      toast({ title: "Budget plan updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update budget plan", variant: "destructive" });
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/budget-categories", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budget-categories"] });
      toast({ title: "Category added successfully" });
      setIsAddCategoryDialogOpen(false);
      setNewCategoryName("");
      setNewCategoryAmount("");
    },
    onError: () => {
      toast({ title: "Failed to add category", variant: "destructive" });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/budget-categories/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budget-categories"] });
      toast({ title: "Category updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update category", variant: "destructive" });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/budget-categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budget-categories"] });
      toast({ title: "Category deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete category", variant: "destructive" });
    },
  });

  const createTransferMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/budget-transfers", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      toast({ title: "Transfer completed successfully" });
      setIsTransferDialogOpen(false);
      setTransferSourceAccount("");
      setTransferDestinationAccount("");
      setTransferAmount("");
      setTransferDescription("");
    },
    onError: (error: any) => {
      const message = error?.message || "Failed to complete transfer";
      toast({ title: message, variant: "destructive" });
    },
  });

  const closeMonthMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/budgets/close-month", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/budgets/current"] });
      queryClient.invalidateQueries({ queryKey: ["/api/budget-categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/budget-categories/usage"] });
      toast({ title: "Month closed and new budget started successfully" });
      setIsCloseMonthDialogOpen(false);
      setAllocations({});
    },
    onError: (error: any) => {
      const message = error?.message || "Failed to close month";
      toast({ title: message, variant: "destructive" });
    },
  });

  const salaryNum = parseFloat(salary || currentBudget?.monthlySalary || "0");
  const totalAllocated = categories.reduce((sum, cat) => sum + cat.budgetedAmount, 0);
  const remaining = salaryNum - totalAllocated;

  const handleSave = () => {
    if (currentBudget) {
      updateBudgetMutation.mutate({
        id: currentBudget.id,
        data: {
          monthlySalary: salaryNum.toFixed(2),
        },
      });
    } else {
      createBudgetMutation.mutate({
        monthlySalary: salaryNum.toFixed(2),
        savingsRate: "20.00",
      });
    }
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    createCategoryMutation.mutate({
      name: newCategoryName,
      budgetedAmount: parseFloat(newCategoryAmount).toFixed(2),
      isPredefined: "false",
    });
  };

  const handleUpdateCategory = (id: number, amount: string) => {
    updateCategoryMutation.mutate({
      id,
      data: {
        budgetedAmount: parseFloat(amount).toFixed(2),
      },
    });
  };

  const handleDeleteCategory = (id: number) => {
    deleteCategoryMutation.mutate(id);
  };

  const handleOpenTransferDialog = (categoryName: string, categoryAmount: string) => {
    // Ensure we only pass numeric value, not formatted string
    const numericAmount = parseFloat(categoryAmount).toFixed(2);
    setTransferAmount(numericAmount);
    setTransferDescription(`Budget: ${categoryName}`);
    setIsTransferDialogOpen(true);
  };

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    if (!transferSourceAccount || !transferDestinationAccount) {
      toast({ title: "Please select both source and destination accounts", variant: "destructive" });
      return;
    }

    if (transferSourceAccount === transferDestinationAccount) {
      toast({ title: "Source and destination accounts must be different", variant: "destructive" });
      return;
    }

    const amount = parseFloat(transferAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Please enter a valid positive amount", variant: "destructive" });
      return;
    }

    createTransferMutation.mutate({
      sourceAccountId: parseInt(transferSourceAccount),
      destinationAccountId: parseInt(transferDestinationAccount),
      amount,
      description: transferDescription || "Budget Transfer",
    });
  };

  const getCategoryAmount = (category: typeof categories[0]) => {
    return editingAmounts[category.id] ?? category.budgetedAmount.toString();
  };

  const handleAmountChange = (id: number, value: string) => {
    setEditingAmounts(prev => ({ ...prev, [id]: value }));
  };

  const handleAmountBlur = (id: number) => {
    const amount = editingAmounts[id];
    if (amount && parseFloat(amount) !== categories.find(c => c.id === id)?.budgetedAmount) {
      handleUpdateCategory(id, amount);
    }
  };

  const isCloseMonthValid = () => {
    // Check that all categories with unused funds have allocations
    const categoriesWithUnusedFunds = categories.filter(cat => cat.budgetedAmount - cat.spentAmount > 0);
    
    // All must have an allocation selected
    const allHaveAllocations = categoriesWithUnusedFunds.every(cat => allocations[cat.id]?.action);
    if (!allHaveAllocations) return false;
    
    // All that require destinations must have them
    const allDestinationsSet = categoriesWithUnusedFunds.every(cat => {
      const allocation = allocations[cat.id];
      if (!allocation) return false;
      
      // Carryover doesn't need destination
      if (allocation.action === 'carryover') return true;
      
      // Others need destination
      return !!allocation.destinationId;
    });
    
    return allDestinationsSet;
  };

  const handleCloseMonth = () => {
    if (!isCloseMonthValid()) {
      toast({ 
        title: "Please complete all allocations", 
        description: "Choose how to handle unused funds for each category and select destinations where required.",
        variant: "destructive" 
      });
      return;
    }

    // Prepare allocations array from state
    const categoriesWithUnusedFunds = categories.filter(cat => cat.budgetedAmount - cat.spentAmount > 0);
    const allocationsArray = categoriesWithUnusedFunds.map(cat => ({
      categoryId: cat.id,
      unusedAmount: cat.budgetedAmount - cat.spentAmount,
      action: allocations[cat.id].action,
      destinationId: allocations[cat.id].destinationId,
    }));

    closeMonthMutation.mutate({ allocations: allocationsArray });
  };

  if (categoriesLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-semibold">Budget Planner</h1>
          <p className="text-muted-foreground">Plan and track your monthly budget by category</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setIsCloseMonthDialogOpen(true)} 
            data-testid="button-close-month"
            variant="outline"
          >
            Close Month & Start New Budget
          </Button>
          <Button onClick={() => setIsAddCategoryDialogOpen(true)} data-testid="button-add-category">
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Income</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="salary">Monthly Salary</Label>
              <Input
                id="salary"
                type="number"
                step="0.01"
                value={salary || currentBudget?.monthlySalary || ""}
                onChange={(e) => setSalary(e.target.value)}
                placeholder="Enter your monthly salary"
                className="font-mono"
                data-testid="input-salary"
              />
            </div>
            <Button
              onClick={handleSave}
              className="w-full"
              disabled={createBudgetMutation.isPending || updateBudgetMutation.isPending}
              data-testid="button-save-budget"
            >
              {createBudgetMutation.isPending || updateBudgetMutation.isPending
                ? "Saving..."
                : "Save Monthly Income"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Budget Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Monthly Income</span>
                <span className="font-mono font-semibold">₱{salaryNum.toFixed(2)}</span>
              </div>
              <Progress value={100} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Allocated</span>
                <span className="font-mono font-semibold">
                  ₱{totalAllocated.toFixed(2)} ({salaryNum > 0 ? ((totalAllocated / salaryNum) * 100).toFixed(2) : "0.00"}%)
                </span>
              </div>
              <Progress value={salaryNum > 0 ? (totalAllocated / salaryNum) * 100 : 0} className="h-2" />
            </div>

            <div className="pt-4 border-t">
              <div className="flex justify-between">
                <span className="font-medium">Remaining</span>
                <span className={`font-mono font-bold text-lg ${remaining < 0 ? 'text-destructive' : 'text-chart-2'}`}>
                  ₱{remaining.toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Budget Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categories.map((category) => (
              <div key={category.id} className="p-4 rounded-md border space-y-3" data-testid={`category-${category.id}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-medium">{category.name}</p>
                    <p className="text-sm text-muted-foreground">
                      ₱{category.spentAmount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / 
                      ₱{category.budgetedAmount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      <span className="ml-2">({category.percentUsed}%)</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={getCategoryAmount(category)}
                      onChange={(e) => handleAmountChange(category.id, e.target.value)}
                      onBlur={() => handleAmountBlur(category.id)}
                      className="w-32 font-mono"
                      data-testid={`input-category-amount-${category.id}`}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleOpenTransferDialog(category.name, getCategoryAmount(category))}
                      data-testid={`button-transfer-category-${category.id}`}
                      title="Transfer this budget amount"
                    >
                      <ArrowRightLeft className="w-4 h-4" />
                    </Button>
                    {category.isPredefined === "false" && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteCategory(category.id)}
                        data-testid={`button-delete-category-${category.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <Progress 
                    value={Math.min(category.percentUsed, 100)} 
                    className={`h-2 ${category.colorIndicator === 'green' ? '[&>div]:bg-green-600' : category.colorIndicator === 'yellow' ? '[&>div]:bg-yellow-600' : '[&>div]:bg-red-600'}`}
                    data-testid={`progress-category-${category.id}`}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      {category.colorIndicator === 'green' && 'On track'}
                      {category.colorIndicator === 'yellow' && 'Approaching limit'}
                      {category.colorIndicator === 'red' && 'Over budget'}
                    </span>
                    <span>
                      ₱{(category.budgetedAmount - category.spentAmount).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} remaining
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {categories.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No budget categories yet. Add your first category to start planning.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isAddCategoryDialogOpen} onOpenChange={setIsAddCategoryDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Budget Category</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddCategory} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="categoryName">Category Name</Label>
              <Input
                id="categoryName"
                placeholder="e.g., Entertainment"
                required
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                data-testid="input-category-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoryAmount">Budgeted Amount</Label>
              <Input
                id="categoryAmount"
                type="number"
                step="0.01"
                placeholder="0.00"
                required
                value={newCategoryAmount}
                onChange={(e) => setNewCategoryAmount(e.target.value)}
                className="font-mono"
                data-testid="input-category-budgeted-amount"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                className="flex-1"
                disabled={createCategoryMutation.isPending}
                data-testid="button-submit-category"
              >
                {createCategoryMutation.isPending ? "Adding..." : "Add Category"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddCategoryDialogOpen(false)}
                data-testid="button-cancel-category"
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Transfer Funds Dialog */}
      <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Transfer Funds Between Accounts</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleTransfer} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="transfer-source">From Account</Label>
              <Select value={transferSourceAccount} onValueChange={setTransferSourceAccount} required>
                <SelectTrigger data-testid="select-transfer-source">
                  <SelectValue placeholder="Select source account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id.toString()}>
                      {account.name} - ₱{parseFloat(account.balance).toLocaleString("en-PH")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transfer-destination">To Account</Label>
              <Select value={transferDestinationAccount} onValueChange={setTransferDestinationAccount} required>
                <SelectTrigger data-testid="select-transfer-destination">
                  <SelectValue placeholder="Select destination account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.filter(a => a.id.toString() !== transferSourceAccount).map((account) => (
                    <SelectItem key={account.id} value={account.id.toString()}>
                      {account.name} - ₱{parseFloat(account.balance).toLocaleString("en-PH")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transfer-amount">Amount</Label>
              <Input
                id="transfer-amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                required
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                className="font-mono"
                data-testid="input-transfer-amount"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="transfer-description">Description (Optional)</Label>
              <Input
                id="transfer-description"
                placeholder="e.g., Moving to savings"
                value={transferDescription}
                onChange={(e) => setTransferDescription(e.target.value)}
                data-testid="input-transfer-description"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                className="flex-1"
                disabled={createTransferMutation.isPending}
                data-testid="button-submit-transfer"
              >
                {createTransferMutation.isPending ? "Transferring..." : "Transfer Funds"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsTransferDialogOpen(false)}
                data-testid="button-cancel-transfer"
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Close Month Dialog */}
      <Dialog open={isCloseMonthDialogOpen} onOpenChange={setIsCloseMonthDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Close Month & Start New Budget</DialogTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Allocate unused budget amounts before closing this month. Choose how to handle any unspent funds for each category.
            </p>
          </DialogHeader>
          
          <div className="space-y-6 mt-4">
            {/* Summary */}
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <h3 className="font-semibold">Month Summary</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Total Budgeted:</span>
                  <span className="ml-2 font-mono">
                    ₱{categories.reduce((sum, cat) => sum + cat.budgetedAmount, 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Spent:</span>
                  <span className="ml-2 font-mono">
                    ₱{categories.reduce((sum, cat) => sum + cat.spentAmount, 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Total Unused:</span>
                  <span className="ml-2 font-mono font-semibold text-green-600">
                    ₱{categories.reduce((sum, cat) => sum + Math.max(0, cat.budgetedAmount - cat.spentAmount), 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Unused Budget Allocations */}
            <div className="space-y-4">
              <h3 className="font-semibold">Allocate Unused Budget</h3>
              {categories.filter(cat => cat.budgetedAmount - cat.spentAmount > 0).map(cat => {
                const unused = cat.budgetedAmount - cat.spentAmount;
                return (
                  <div key={cat.id} className="border rounded-lg p-4 space-y-3" data-testid={`allocation-${cat.id}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{cat.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Unused: ₱{unused.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Action</Label>
                      <Select
                        value={allocations[cat.id]?.action || ''}
                        onValueChange={(value: any) => {
                          setAllocations(prev => ({
                            ...prev,
                            [cat.id]: { action: value, destinationId: undefined }
                          }));
                        }}
                      >
                        <SelectTrigger data-testid={`select-action-${cat.id}`}>
                          <SelectValue placeholder="Choose what to do with unused budget" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="carryover">Carry over to next month</SelectItem>
                          <SelectItem value="account">Transfer to account</SelectItem>
                          <SelectItem value="goal">Transfer to savings goal</SelectItem>
                          <SelectItem value="investment">Transfer to investment</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Destination selector for account/goal/investment */}
                    {allocations[cat.id]?.action === 'account' && (
                      <div className="space-y-2">
                        <Label>Destination Account</Label>
                        <Select
                          value={allocations[cat.id]?.destinationId?.toString() || ''}
                          onValueChange={(value) => {
                            setAllocations(prev => ({
                              ...prev,
                              [cat.id]: { ...prev[cat.id], destinationId: parseInt(value) }
                            }));
                          }}
                        >
                          <SelectTrigger data-testid={`select-account-${cat.id}`}>
                            <SelectValue placeholder="Select account" />
                          </SelectTrigger>
                          <SelectContent>
                            {accounts.map(acc => (
                              <SelectItem key={acc.id} value={acc.id.toString()}>
                                {acc.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {allocations[cat.id]?.action === 'goal' && (
                      <div className="space-y-2">
                        <Label>Destination Goal</Label>
                        <Select
                          value={allocations[cat.id]?.destinationId?.toString() || ''}
                          onValueChange={(value) => {
                            setAllocations(prev => ({
                              ...prev,
                              [cat.id]: { ...prev[cat.id], destinationId: parseInt(value) }
                            }));
                          }}
                        >
                          <SelectTrigger data-testid={`select-goal-${cat.id}`}>
                            <SelectValue placeholder="Select goal" />
                          </SelectTrigger>
                          <SelectContent>
                            {goals.map(goal => (
                              <SelectItem key={goal.id} value={goal.id.toString()}>
                                {goal.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {allocations[cat.id]?.action === 'investment' && (
                      <div className="space-y-2">
                        <Label>Destination Investment</Label>
                        <Select
                          value={allocations[cat.id]?.destinationId?.toString() || ''}
                          onValueChange={(value) => {
                            setAllocations(prev => ({
                              ...prev,
                              [cat.id]: { ...prev[cat.id], destinationId: parseInt(value) }
                            }));
                          }}
                        >
                          <SelectTrigger data-testid={`select-investment-${cat.id}`}>
                            <SelectValue placeholder="Select investment" />
                          </SelectTrigger>
                          <SelectContent>
                            {investments.map(inv => (
                              <SelectItem key={inv.id} value={inv.id.toString()}>
                                {inv.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                );
              })}

              {categories.filter(cat => cat.budgetedAmount - cat.spentAmount > 0).length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No unused budget this month. All categories are fully utilized or over budget.
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4 border-t">
              <Button
                onClick={handleCloseMonth}
                className="flex-1"
                disabled={closeMonthMutation.isPending || !isCloseMonthValid()}
                data-testid="button-confirm-close-month"
              >
                {closeMonthMutation.isPending ? "Closing Month..." : "Close Month & Start New Budget"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCloseMonthDialogOpen(false)}
                data-testid="button-cancel-close-month"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
