import { useState } from "react";
import { AccountCard } from "@/components/AccountCard";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Account } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function AccountsPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<number | null>(null);
  const [deletingAccountId, setDeletingAccountId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [balance, setBalance] = useState("");
  const [creditLimit, setCreditLimit] = useState("");
  const { toast } = useToast();

  const { data: accounts, isLoading } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
  });

  const createAccountMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/accounts", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      toast({ title: "Account created successfully" });
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to create account", variant: "destructive" });
    },
  });

  const updateAccountMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/accounts/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      toast({ title: "Account updated successfully" });
      setIsEditDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to update account", variant: "destructive" });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/accounts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Account deleted successfully" });
      setIsDeleteDialogOpen(false);
      setDeletingAccountId(null);
    },
    onError: () => {
      toast({ title: "Failed to delete account", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setName("");
    setType("");
    setBalance("");
    setCreditLimit("");
    setEditingAccountId(null);
  };

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    createAccountMutation.mutate({
      name,
      type,
      balance: parseFloat(balance).toFixed(2),
      creditLimit: creditLimit ? parseFloat(creditLimit).toFixed(2) : null,
    });
  };

  const handleEditAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccountId) return;
    updateAccountMutation.mutate({
      id: editingAccountId,
      data: {
        name,
        type,
        balance: parseFloat(balance).toFixed(2),
        creditLimit: creditLimit ? parseFloat(creditLimit).toFixed(2) : null,
      },
    });
  };

  const openEditDialog = (account: Account) => {
    setEditingAccountId(account.id);
    setName(account.name);
    setType(account.type);
    setBalance(account.balance);
    setCreditLimit(account.creditLimit || "");
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (id: number) => {
    setDeletingAccountId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (deletingAccountId) {
      deleteAccountMutation.mutate(deletingAccountId);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-semibold">Accounts</h1>
          <p className="text-muted-foreground">Manage your financial accounts</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-account">
          <Plus className="w-4 h-4 mr-2" />
          Add Account
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {accounts?.map((account) => (
          <AccountCard
            key={account.id}
            id={account.id}
            name={account.name}
            type={account.type}
            balance={parseFloat(account.balance)}
            creditLimit={account.creditLimit ? parseFloat(account.creditLimit) : undefined}
            onEdit={() => openEditDialog(account)}
            onDelete={() => openDeleteDialog(account.id)}
          />
        ))}
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Account</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddAccount} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="accountName">Account Name</Label>
              <Input
                id="accountName"
                placeholder="e.g., Main Checking"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                data-testid="input-account-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountType">Account Type</Label>
              <Select required value={type} onValueChange={setType}>
                <SelectTrigger data-testid="select-account-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank">Bank Account</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="ewallet">E-Wallet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="balance">Initial Balance</Label>
              <Input
                id="balance"
                type="number"
                step="0.01"
                placeholder="0.00"
                required
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                data-testid="input-account-balance"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="creditLimit">Credit Limit (optional)</Label>
              <Input
                id="creditLimit"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value)}
                data-testid="input-credit-limit"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                className="flex-1"
                disabled={createAccountMutation.isPending}
                data-testid="button-submit-account"
              >
                {createAccountMutation.isPending ? "Adding..." : "Add Account"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
                data-testid="button-cancel-account"
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
            <DialogTitle>Edit Account</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditAccount} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editAccountName">Account Name</Label>
              <Input
                id="editAccountName"
                placeholder="e.g., Main Checking"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                data-testid="input-edit-account-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editAccountType">Account Type</Label>
              <Select required value={type} onValueChange={setType}>
                <SelectTrigger data-testid="select-edit-account-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank">Bank Account</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="ewallet">E-Wallet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editBalance">Balance</Label>
              <Input
                id="editBalance"
                type="number"
                step="0.01"
                placeholder="0.00"
                required
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                data-testid="input-edit-account-balance"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editCreditLimit">Credit Limit (optional)</Label>
              <Input
                id="editCreditLimit"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value)}
                data-testid="input-edit-credit-limit"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                className="flex-1"
                disabled={updateAccountMutation.isPending}
                data-testid="button-submit-edit-account"
              >
                {updateAccountMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  resetForm();
                }}
                data-testid="button-cancel-edit-account"
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
            <AlertDialogTitle>Delete Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this account? This action cannot be undone and will remove all associated transactions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-account">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-account"
            >
              {deleteAccountMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
