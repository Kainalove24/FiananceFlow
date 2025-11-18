import { useState } from "react";
import { GoalCard } from "@/components/GoalCard";
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
import { Plus, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Goal, Account } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function GoalsPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);
  const [editingGoalId, setEditingGoalId] = useState<number | null>(null);
  const [deletingGoalId, setDeletingGoalId] = useState<number | null>(null);
  const [deadline, setDeadline] = useState<Date>(new Date());
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [depositAccountId, setDepositAccountId] = useState("");
  const { toast } = useToast();

  const { data: goals, isLoading } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
  });

  const { data: accounts } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
  });

  const createGoalMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/goals", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      toast({ title: "Goal created successfully" });
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to create goal", variant: "destructive" });
    },
  });

  const editGoalMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/goals/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      toast({ title: "Goal updated successfully" });
      setIsEditDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to update goal", variant: "destructive" });
    },
  });

  const depositGoalMutation = useMutation({
    mutationFn: async ({ id, amount, accountId }: { id: number; amount: number; accountId: number }) => {
      const res = await apiRequest("POST", `/api/goals/${id}/deposit`, { amount, accountId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      toast({ title: "Deposit added successfully" });
      setIsDepositDialogOpen(false);
      setDepositAmount("");
      setDepositAccountId("");
      setSelectedGoalId(null);
    },
    onError: () => {
      toast({ title: "Failed to add deposit", variant: "destructive" });
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/goals/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      toast({ title: "Goal deleted successfully" });
      setIsDeleteDialogOpen(false);
      setDeletingGoalId(null);
    },
    onError: () => {
      toast({ title: "Failed to delete goal", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setName("");
    setTargetAmount("");
    setCurrentAmount("");
    setDeadline(new Date());
    setEditingGoalId(null);
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    createGoalMutation.mutate({
      name,
      targetAmount: parseFloat(targetAmount).toFixed(2),
      currentAmount: currentAmount ? parseFloat(currentAmount).toFixed(2) : "0.00",
      deadline,
    });
  };

  const handleEditGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGoalId) return;
    editGoalMutation.mutate({
      id: editingGoalId,
      data: {
        name,
        targetAmount: parseFloat(targetAmount).toFixed(2),
        currentAmount: parseFloat(currentAmount).toFixed(2),
        deadline,
      },
    });
  };

  const openEditDialog = (goal: Goal) => {
    setEditingGoalId(goal.id);
    setName(goal.name);
    setTargetAmount(goal.targetAmount);
    setCurrentAmount(goal.currentAmount);
    setDeadline(new Date(goal.deadline));
    setIsEditDialogOpen(true);
  };

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoalId || !depositAmount || !depositAccountId) return;

    depositGoalMutation.mutate({
      id: selectedGoalId,
      amount: parseFloat(depositAmount),
      accountId: parseInt(depositAccountId),
    });
  };

  const handleDepositClick = (goalId: number) => {
    setSelectedGoalId(goalId);
    setIsDepositDialogOpen(true);
  };

  const openDeleteDialog = (id: number) => {
    setDeletingGoalId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (deletingGoalId) {
      deleteGoalMutation.mutate(deletingGoalId);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-semibold">Savings Goals</h1>
          <p className="text-muted-foreground">Track your financial goals and progress</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-goal">
          <Plus className="w-4 h-4 mr-2" />
          Add Goal
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals?.map((goal) => (
          <GoalCard
            key={goal.id}
            id={goal.id}
            name={goal.name}
            targetAmount={parseFloat(goal.targetAmount)}
            currentAmount={parseFloat(goal.currentAmount)}
            deadline={new Date(goal.deadline)}
            onDeposit={handleDepositClick}
            onEdit={() => openEditDialog(goal)}
            onDelete={() => openDeleteDialog(goal.id)}
          />
        ))}
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Goal</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddGoal} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="goalName">Goal Name</Label>
              <Input
                id="goalName"
                placeholder="e.g., Emergency Fund"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                data-testid="input-goal-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetAmount">Target Amount</Label>
              <Input
                id="targetAmount"
                type="number"
                step="0.01"
                placeholder="0.00"
                required
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                data-testid="input-target-amount"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentAmount">Current Amount</Label>
              <Input
                id="currentAmount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
                data-testid="input-current-amount"
              />
            </div>

            <div className="space-y-2">
              <Label>Deadline</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start" data-testid="button-deadline">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(deadline, "MMM dd, yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={deadline} onSelect={(d) => d && setDeadline(d)} initialFocus />
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
                {createGoalMutation.isPending ? "Adding..." : "Add Goal"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
                data-testid="button-cancel-goal"
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDepositDialogOpen} onOpenChange={setIsDepositDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Make a Deposit</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleDeposit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="depositAmount">Deposit Amount</Label>
              <Input
                id="depositAmount"
                type="number"
                step="0.01"
                placeholder="0.00"
                required
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                data-testid="input-deposit-amount"
              />
            </div>

            <div className="space-y-2">
              <Label>From Account</Label>
              <Select value={depositAccountId} onValueChange={setDepositAccountId} required>
                <SelectTrigger data-testid="select-deposit-account">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts?.map((account) => (
                    <SelectItem key={account.id} value={account.id.toString()}>
                      {account.name} (₱{parseFloat(account.balance).toFixed(2)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                className="flex-1"
                disabled={depositGoalMutation.isPending || !depositAccountId}
                data-testid="button-submit-deposit"
              >
                {depositGoalMutation.isPending ? "Depositing..." : "Deposit"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDepositDialogOpen(false)}
                data-testid="button-cancel-deposit"
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Goal</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditGoal} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editGoalName">Goal Name</Label>
              <Input
                id="editGoalName"
                placeholder="e.g., Emergency Fund"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                data-testid="input-edit-goal-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editTargetAmount">Target Amount</Label>
              <Input
                id="editTargetAmount"
                type="number"
                step="0.01"
                placeholder="0.00"
                required
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                data-testid="input-edit-target-amount"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editCurrentAmount">Current Amount</Label>
              <Input
                id="editCurrentAmount"
                type="number"
                step="0.01"
                placeholder="0.00"
                required
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
                data-testid="input-edit-current-amount"
              />
            </div>

            <div className="space-y-2">
              <Label>Deadline</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start" data-testid="button-edit-deadline">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(deadline, "MMM dd, yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={deadline} onSelect={(d) => d && setDeadline(d)} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                className="flex-1"
                disabled={editGoalMutation.isPending}
                data-testid="button-submit-edit-goal"
              >
                {editGoalMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  resetForm();
                }}
                data-testid="button-cancel-edit-goal"
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Goal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this savings goal? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-goal">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-goal"
            >
              {deleteGoalMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
