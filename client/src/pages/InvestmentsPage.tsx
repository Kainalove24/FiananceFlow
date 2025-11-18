import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, CalendarIcon, TrendingUp, TrendingDown, DollarSign, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Investment, Account } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function InvestmentsPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false);
  const [isLiquidateDialogOpen, setIsLiquidateDialogOpen] = useState(false);
  const [selectedInvestmentId, setSelectedInvestmentId] = useState<number | null>(null);
  const [editingInvestmentId, setEditingInvestmentId] = useState<number | null>(null);
  const [liquidatingInvestmentId, setLiquidatingInvestmentId] = useState<number | null>(null);
  const [liquidationAction, setLiquidationAction] = useState<'transfer' | 'loss'>('transfer');
  const [liquidationDestinationType, setLiquidationDestinationType] = useState<'account' | 'investment'>('account');
  const [liquidationDestinationId, setLiquidationDestinationId] = useState("");
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [initialAmount, setInitialAmount] = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [depositAccountId, setDepositAccountId] = useState("");
  const { toast } = useToast();

  const { data: investments, isLoading } = useQuery<Investment[]>({
    queryKey: ["/api/investments"],
  });

  const { data: accounts } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
  });

  const createInvestmentMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/investments", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/investments"] });
      toast({ title: "Investment created successfully" });
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to create investment", variant: "destructive" });
    },
  });

  const editInvestmentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/investments/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/investments"] });
      toast({ title: "Investment updated successfully" });
      setIsEditDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to update investment", variant: "destructive" });
    },
  });

  const depositInvestmentMutation = useMutation({
    mutationFn: async ({ id, amount, accountId }: { id: number; amount: number; accountId: number }) => {
      const res = await apiRequest("POST", `/api/investments/${id}/deposit`, { amount, accountId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/investments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      toast({ title: "Deposit added successfully" });
      setIsDepositDialogOpen(false);
      setDepositAmount("");
      setDepositAccountId("");
      setSelectedInvestmentId(null);
    },
    onError: () => {
      toast({ title: "Failed to add deposit", variant: "destructive" });
    },
  });

  const liquidateInvestmentMutation = useMutation({
    mutationFn: async ({ id, action, destinationType, destinationId }: { 
      id: number; 
      action: 'transfer' | 'loss'; 
      destinationType?: 'account' | 'investment';
      destinationId?: number;
    }) => {
      await apiRequest("POST", `/api/investments/${id}/liquidate`, { 
        action, 
        destinationType, 
        destinationId 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/investments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      toast({ title: "Investment liquidated successfully" });
      setIsLiquidateDialogOpen(false);
      setLiquidatingInvestmentId(null);
      setLiquidationAction('transfer');
      setLiquidationDestinationType('account');
      setLiquidationDestinationId("");
    },
    onError: () => {
      toast({ title: "Failed to liquidate investment", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setName("");
    setType("");
    setInitialAmount("");
    setCurrentValue("");
    setStartDate(new Date());
    setEditingInvestmentId(null);
  };

  const handleAdd = () => {
    createInvestmentMutation.mutate({
      name,
      type,
      initialAmount,
      currentValue: currentValue || initialAmount,
      startDate,
    });
  };

  const handleEdit = () => {
    if (!editingInvestmentId) return;
    editInvestmentMutation.mutate({
      id: editingInvestmentId,
      data: {
        name,
        type,
        initialAmount,
        currentValue,
        startDate,
      },
    });
  };

  const openEditDialog = (investment: Investment) => {
    setEditingInvestmentId(investment.id);
    setName(investment.name);
    setType(investment.type);
    setInitialAmount(investment.initialAmount);
    setCurrentValue(investment.currentValue);
    setStartDate(new Date(investment.startDate));
    setIsEditDialogOpen(true);
  };

  const openDepositDialog = (investmentId: number) => {
    setSelectedInvestmentId(investmentId);
    setIsDepositDialogOpen(true);
  };

  const handleDeposit = () => {
    if (!selectedInvestmentId || !depositAmount || !depositAccountId) return;
    depositInvestmentMutation.mutate({
      id: selectedInvestmentId,
      amount: parseFloat(depositAmount),
      accountId: parseInt(depositAccountId),
    });
  };

  const openLiquidateDialog = (investmentId: number) => {
    setLiquidatingInvestmentId(investmentId);
    setIsLiquidateDialogOpen(true);
  };

  const handleLiquidate = () => {
    if (!liquidatingInvestmentId) return;
    
    if (liquidationAction === 'transfer' && !liquidationDestinationId) {
      toast({ title: "Please select a destination", variant: "destructive" });
      return;
    }

    liquidateInvestmentMutation.mutate({
      id: liquidatingInvestmentId,
      action: liquidationAction,
      destinationType: liquidationAction === 'transfer' ? liquidationDestinationType : undefined,
      destinationId: liquidationAction === 'transfer' ? parseInt(liquidationDestinationId) : undefined,
    });
  };

  const calculateReturns = (investment: Investment) => {
    const initial = parseFloat(investment.initialAmount);
    const current = parseFloat(investment.currentValue);
    const gain = current - initial;
    const percentage = initial > 0 ? ((gain / initial) * 100) : 0;
    return { gain, percentage };
  };

  const getInvestmentTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      stocks: "Stocks",
      bonds: "Bonds",
      mutual_funds: "Mutual Funds",
      crypto: "Cryptocurrency",
      real_estate: "Real Estate",
      etf: "ETF",
      other: "Other",
    };
    return typeMap[type] || type;
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-center">Loading investments...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold">Investments</h1>
        <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-investment">
          <Plus className="w-4 h-4 mr-2" />
          Add Investment
        </Button>
      </div>

      {investments && investments.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {investments.map((investment) => {
            const { gain, percentage } = calculateReturns(investment);
            const isPositive = gain >= 0;

            return (
              <Card key={investment.id} data-testid={`card-investment-${investment.id}`} className="hover-elevate">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-medium">{investment.name}</CardTitle>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => openEditDialog(investment)}
                      data-testid={`button-edit-investment-${investment.id}`}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => openLiquidateDialog(investment.id)}
                      data-testid={`button-delete-investment-${investment.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" data-testid={`badge-investment-type-${investment.id}`}>
                      {getInvestmentTypeLabel(investment.type)}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(investment.startDate), "MMM d, yyyy")}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Initial Amount</span>
                      <span className="font-mono text-sm" data-testid={`text-initial-amount-${investment.id}`}>
                        ₱{parseFloat(investment.initialAmount).toLocaleString("en-PH", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Current Value</span>
                      <span className="font-mono text-sm font-semibold" data-testid={`text-current-value-${investment.id}`}>
                        ₱{parseFloat(investment.currentValue).toLocaleString("en-PH", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>

                  <div className={`flex items-center gap-2 p-3 rounded-lg ${
                    isPositive ? "bg-green-500/10" : "bg-red-500/10"
                  }`}>
                    {isPositive ? (
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-600" />
                    )}
                    <div className="flex-1">
                      <div className={`text-sm font-semibold ${
                        isPositive ? "text-green-600" : "text-red-600"
                      }`} data-testid={`text-returns-${investment.id}`}>
                        {isPositive ? "+" : ""}₱{Math.abs(gain).toLocaleString("en-PH", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {isPositive ? "+" : ""}{percentage.toFixed(2)}% Returns
                      </div>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => openDepositDialog(investment.id)}
                    data-testid={`button-make-deposit-${investment.id}`}
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Make Deposit
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>No investments yet. Add your first investment to start tracking your portfolio.</p>
          </CardContent>
        </Card>
      )}

      {/* Add Investment Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Investment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Investment Name</Label>
              <Input
                id="name"
                placeholder="e.g., Stock Portfolio"
                value={name}
                onChange={(e) => setName(e.target.value)}
                data-testid="input-investment-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Investment Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger data-testid="select-investment-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stocks">Stocks</SelectItem>
                  <SelectItem value="bonds">Bonds</SelectItem>
                  <SelectItem value="mutual_funds">Mutual Funds</SelectItem>
                  <SelectItem value="crypto">Cryptocurrency</SelectItem>
                  <SelectItem value="real_estate">Real Estate</SelectItem>
                  <SelectItem value="etf">ETF</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="initialAmount">Initial Amount (₱)</Label>
              <Input
                id="initialAmount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={initialAmount}
                onChange={(e) => setInitialAmount(e.target.value)}
                className="font-mono"
                data-testid="input-initial-amount"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentValue">Current Value (₱)</Label>
              <Input
                id="currentValue"
                type="number"
                step="0.01"
                placeholder="Same as initial amount"
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                className="font-mono"
                data-testid="input-current-value"
              />
            </div>

            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start" data-testid="button-select-start-date">
                    <CalendarIcon className="mr-2 w-4 h-4" />
                    {format(startDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={startDate} onSelect={(date) => date && setStartDate(date)} />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleAdd}
                className="flex-1"
                disabled={createInvestmentMutation.isPending}
                data-testid="button-submit-investment"
              >
                {createInvestmentMutation.isPending ? "Adding..." : "Add Investment"}
              </Button>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} data-testid="button-cancel-add">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Investment Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Investment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Investment Name</Label>
              <Input
                id="edit-name"
                placeholder="e.g., Stock Portfolio"
                value={name}
                onChange={(e) => setName(e.target.value)}
                data-testid="input-edit-investment-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-type">Investment Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger data-testid="select-edit-investment-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stocks">Stocks</SelectItem>
                  <SelectItem value="bonds">Bonds</SelectItem>
                  <SelectItem value="mutual_funds">Mutual Funds</SelectItem>
                  <SelectItem value="crypto">Cryptocurrency</SelectItem>
                  <SelectItem value="real_estate">Real Estate</SelectItem>
                  <SelectItem value="etf">ETF</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-initialAmount">Initial Amount (₱)</Label>
              <Input
                id="edit-initialAmount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={initialAmount}
                onChange={(e) => setInitialAmount(e.target.value)}
                className="font-mono"
                data-testid="input-edit-initial-amount"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-currentValue">Current Value (₱)</Label>
              <Input
                id="edit-currentValue"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                className="font-mono"
                data-testid="input-edit-current-value"
              />
            </div>

            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start" data-testid="button-edit-start-date">
                    <CalendarIcon className="mr-2 w-4 h-4" />
                    {format(startDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={startDate} onSelect={(date) => date && setStartDate(date)} />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleEdit}
                className="flex-1"
                disabled={editInvestmentMutation.isPending}
                data-testid="button-submit-edit-investment"
              >
                {editInvestmentMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} data-testid="button-cancel-edit">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Make Deposit Dialog */}
      <Dialog open={isDepositDialogOpen} onOpenChange={setIsDepositDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Make Deposit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="depositAmount">Deposit Amount (₱)</Label>
              <Input
                id="depositAmount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="font-mono"
                data-testid="input-deposit-amount"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="depositAccount">From Account</Label>
              <Select value={depositAccountId} onValueChange={setDepositAccountId}>
                <SelectTrigger data-testid="select-deposit-account">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts?.map((account) => (
                    <SelectItem key={account.id} value={account.id.toString()}>
                      {account.name} - ₱{parseFloat(account.balance).toLocaleString("en-PH")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleDeposit}
                className="flex-1"
                disabled={depositInvestmentMutation.isPending}
                data-testid="button-submit-deposit"
              >
                {depositInvestmentMutation.isPending ? "Processing..." : "Make Deposit"}
              </Button>
              <Button variant="outline" onClick={() => setIsDepositDialogOpen(false)} data-testid="button-cancel-deposit">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Liquidate Investment Dialog */}
      <Dialog open={isLiquidateDialogOpen} onOpenChange={setIsLiquidateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Liquidate Investment</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>What would you like to do with the funds?</Label>
              <div className="space-y-2">
                <Button
                  variant={liquidationAction === 'transfer' ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => setLiquidationAction('transfer')}
                  data-testid="button-liquidation-transfer"
                >
                  Transfer Funds
                </Button>
                <Button
                  variant={liquidationAction === 'loss' ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => setLiquidationAction('loss')}
                  data-testid="button-liquidation-loss"
                >
                  Mark as Lost
                </Button>
              </div>
            </div>

            {liquidationAction === 'transfer' && (
              <>
                <div className="space-y-2">
                  <Label>Transfer to</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={liquidationDestinationType === 'account' ? 'default' : 'outline'}
                      className="flex-1"
                      onClick={() => {
                        setLiquidationDestinationType('account');
                        setLiquidationDestinationId("");
                      }}
                      data-testid="button-destination-account"
                    >
                      Account
                    </Button>
                    <Button
                      variant={liquidationDestinationType === 'investment' ? 'default' : 'outline'}
                      className="flex-1"
                      onClick={() => {
                        setLiquidationDestinationType('investment');
                        setLiquidationDestinationId("");
                      }}
                      data-testid="button-destination-investment"
                    >
                      Investment
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>
                    {liquidationDestinationType === 'account' ? 'Select Account' : 'Select Investment'}
                  </Label>
                  <Select value={liquidationDestinationId} onValueChange={setLiquidationDestinationId}>
                    <SelectTrigger data-testid="select-liquidation-destination">
                      <SelectValue placeholder={`Choose ${liquidationDestinationType}...`} />
                    </SelectTrigger>
                    <SelectContent>
                      {liquidationDestinationType === 'account' ? (
                        accounts?.map((account) => (
                          <SelectItem key={account.id} value={account.id.toString()}>
                            {account.name} - ₱{parseFloat(account.balance).toLocaleString("en-PH")}
                          </SelectItem>
                        ))
                      ) : (
                        investments?.filter(inv => inv.id !== liquidatingInvestmentId).map((investment) => (
                          <SelectItem key={investment.id} value={investment.id.toString()}>
                            {investment.name} - ₱{parseFloat(investment.currentValue).toLocaleString("en-PH")}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {liquidationAction === 'loss' && (
              <div className="text-sm text-muted-foreground">
                This will record the investment as a complete loss. The transaction history will be preserved for your records.
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleLiquidate}
                className="flex-1"
                disabled={liquidateInvestmentMutation.isPending}
                data-testid="button-confirm-liquidate"
              >
                {liquidateInvestmentMutation.isPending ? "Processing..." : "Confirm"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsLiquidateDialogOpen(false)}
                data-testid="button-cancel-liquidate"
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
