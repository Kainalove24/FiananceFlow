import { useState } from "react";
import { InstallmentCard } from "@/components/InstallmentCard";
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
import { Plus, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Installment, Account } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function InstallmentsPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [editingInstallmentId, setEditingInstallmentId] = useState<number | null>(null);
  const [deletingInstallmentId, setDeletingInstallmentId] = useState<number | null>(null);
  const [paymentInstallmentId, setPaymentInstallmentId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [name, setName] = useState("");
  const [monthlyAmount, setMonthlyAmount] = useState("");
  const [term, setTerm] = useState("");
  const [accountId, setAccountId] = useState("");
  const [paymentAccountId, setPaymentAccountId] = useState("");
  const { toast } = useToast();

  const { data: installments, isLoading } = useQuery<Installment[]>({
    queryKey: ["/api/installments"],
  });

  const { data: accounts } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
  });

  const createInstallmentMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/installments", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/installments"] });
      toast({ title: "Installment created successfully" });
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to create installment", variant: "destructive" });
    },
  });

  const editInstallmentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/installments/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/installments"] });
      toast({ title: "Installment updated successfully" });
      setIsEditDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to update installment", variant: "destructive" });
    },
  });

  const deleteInstallmentMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/installments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/installments"] });
      toast({ title: "Installment deleted successfully" });
      setIsDeleteDialogOpen(false);
      setDeletingInstallmentId(null);
    },
    onError: () => {
      toast({ title: "Failed to delete installment", variant: "destructive" });
    },
  });

  const makePaymentMutation = useMutation({
    mutationFn: async ({ id, accountId }: { id: number; accountId: number }) => {
      const res = await apiRequest("POST", `/api/installments/${id}/pay`, { accountId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/installments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      toast({ title: "Payment made successfully" });
      setIsPaymentDialogOpen(false);
      setPaymentAccountId("");
      setPaymentInstallmentId(null);
    },
    onError: () => {
      toast({ title: "Failed to make payment", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setName("");
    setMonthlyAmount("");
    setTerm("");
    setAccountId("");
    setStartDate(new Date());
    setEditingInstallmentId(null);
  };

  const handleAddInstallment = (e: React.FormEvent) => {
    e.preventDefault();
    createInstallmentMutation.mutate({
      name,
      monthlyAmount: parseFloat(monthlyAmount).toFixed(2),
      term: parseInt(term),
      startDate,
      accountId: parseInt(accountId),
    });
  };

  const handleEditInstallment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInstallmentId) return;
    editInstallmentMutation.mutate({
      id: editingInstallmentId,
      data: {
        name,
        monthlyAmount: parseFloat(monthlyAmount).toFixed(2),
        term: parseInt(term),
        startDate,
        accountId: parseInt(accountId),
      },
    });
  };

  const openEditDialog = (installment: Installment) => {
    setEditingInstallmentId(installment.id);
    setName(installment.name);
    setMonthlyAmount(installment.monthlyAmount);
    setTerm(installment.term.toString());
    setStartDate(new Date(installment.startDate));
    setAccountId(installment.accountId.toString());
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (id: number) => {
    setDeletingInstallmentId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (deletingInstallmentId) {
      deleteInstallmentMutation.mutate(deletingInstallmentId);
    }
  };

  const openPaymentDialog = (installmentId: number) => {
    setPaymentInstallmentId(installmentId);
    setIsPaymentDialogOpen(true);
  };

  const handleMakePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentInstallmentId || !paymentAccountId) return;

    makePaymentMutation.mutate({
      id: paymentInstallmentId,
      accountId: parseInt(paymentAccountId),
    });
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-semibold">Installments</h1>
          <p className="text-muted-foreground">Track your payment plans and loans</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-installment">
          <Plus className="w-4 h-4 mr-2" />
          Add Installment
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {installments?.map((installment) => (
          <InstallmentCard
            key={installment.id}
            id={installment.id}
            name={installment.name}
            monthlyAmount={parseFloat(installment.monthlyAmount)}
            monthsPaid={installment.monthsPaid}
            term={installment.term}
            status={installment.status}
            onEdit={() => openEditDialog(installment)}
            onDelete={() => openDeleteDialog(installment.id)}
            onPayment={() => openPaymentDialog(installment.id)}
          />
        ))}
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Installment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddInstallment} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="e.g., Laptop Purchase"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                data-testid="input-installment-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthlyAmount">Monthly Amount</Label>
              <Input
                id="monthlyAmount"
                type="number"
                step="0.01"
                placeholder="0.00"
                required
                value={monthlyAmount}
                onChange={(e) => setMonthlyAmount(e.target.value)}
                data-testid="input-monthly-amount"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="term">Term (months)</Label>
              <Input
                id="term"
                type="number"
                placeholder="12"
                required
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                data-testid="input-term"
              />
            </div>

            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start" data-testid="button-start-date">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(startDate, "MMM dd, yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={startDate} onSelect={(d) => d && setStartDate(d)} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="account">Account</Label>
              <Select required value={accountId} onValueChange={setAccountId}>
                <SelectTrigger data-testid="select-installment-account">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts?.map((account) => (
                    <SelectItem key={account.id} value={account.id.toString()}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                className="flex-1"
                disabled={createInstallmentMutation.isPending}
                data-testid="button-submit-installment"
              >
                {createInstallmentMutation.isPending ? "Adding..." : "Add Installment"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
                data-testid="button-cancel-installment"
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
            <DialogTitle>Edit Installment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditInstallment} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editName">Name</Label>
              <Input
                id="editName"
                placeholder="e.g., Laptop Purchase"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                data-testid="input-edit-installment-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editMonthlyAmount">Monthly Amount</Label>
              <Input
                id="editMonthlyAmount"
                type="number"
                step="0.01"
                placeholder="0.00"
                required
                value={monthlyAmount}
                onChange={(e) => setMonthlyAmount(e.target.value)}
                data-testid="input-edit-monthly-amount"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editTerm">Term (months)</Label>
              <Input
                id="editTerm"
                type="number"
                placeholder="12"
                required
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                data-testid="input-edit-term"
              />
            </div>

            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start" data-testid="button-edit-start-date">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(startDate, "MMM dd, yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={startDate} onSelect={(d) => d && setStartDate(d)} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editAccount">Account</Label>
              <Select required value={accountId} onValueChange={setAccountId}>
                <SelectTrigger data-testid="select-edit-installment-account">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts?.map((account) => (
                    <SelectItem key={account.id} value={account.id.toString()}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                className="flex-1"
                disabled={editInstallmentMutation.isPending}
                data-testid="button-submit-edit-installment"
              >
                {editInstallmentMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  resetForm();
                }}
                data-testid="button-cancel-edit-installment"
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
            <AlertDialogTitle>Delete Installment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this installment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-installment">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-installment"
            >
              {deleteInstallmentMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Make Payment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleMakePayment} className="space-y-4">
            <div className="space-y-2">
              <Label>Payment Account</Label>
              <Select value={paymentAccountId} onValueChange={setPaymentAccountId} required>
                <SelectTrigger data-testid="select-payment-account">
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

            {paymentInstallmentId && installments && (
              <div className="bg-muted p-3 rounded-md space-y-1">
                <p className="text-sm text-muted-foreground">Payment Amount</p>
                <p className="text-lg font-semibold">
                  ₱{parseFloat(installments.find(i => i.id === paymentInstallmentId)?.monthlyAmount || "0").toFixed(2)}
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                className="flex-1"
                disabled={makePaymentMutation.isPending || !paymentAccountId}
                data-testid="button-submit-payment"
              >
                {makePaymentMutation.isPending ? "Processing..." : "Make Payment"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPaymentDialogOpen(false)}
                data-testid="button-cancel-payment"
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
