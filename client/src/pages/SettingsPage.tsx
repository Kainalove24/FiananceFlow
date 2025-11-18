import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Download, FileJson, FileSpreadsheet, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef } from "react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Account, Transaction, Budget, Installment, Goal, Investment } from "@shared/schema";

export default function SettingsPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  const { data: accounts } = useQuery<Account[]>({ queryKey: ["/api/accounts"] });
  const { data: transactions } = useQuery<Transaction[]>({ queryKey: ["/api/transactions"] });
  const { data: budgets } = useQuery<Budget[]>({ queryKey: ["/api/budgets"] });
  const { data: installments } = useQuery<Installment[]>({ queryKey: ["/api/installments"] });
  const { data: goals } = useQuery<Goal[]>({ queryKey: ["/api/goals"] });
  const { data: investments } = useQuery<Investment[]>({ queryKey: ["/api/investments"] });

  const importMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/import", data);
    },
    onSuccess: (result: any) => {
      const { imported, errors } = result;
      const total = Object.values(imported).reduce((sum: number, count) => sum + (count as number), 0);
      
      let description = `Successfully imported ${total} records`;
      if (imported.accounts > 0) description += `\n• Accounts: ${imported.accounts}`;
      if (imported.transactions > 0) description += `\n• Transactions: ${imported.transactions}`;
      if (imported.budgets > 0) description += `\n• Budgets: ${imported.budgets}`;
      if (imported.installments > 0) description += `\n• Installments: ${imported.installments}`;
      if (imported.goals > 0) description += `\n• Goals: ${imported.goals}`;
      if (imported.investments > 0) description += `\n• Investments: ${imported.investments}`;
      
      if (errors && errors.length > 0) {
        description += `\n\nSome records failed: ${errors.length} errors`;
      }

      toast({
        title: errors && errors.length > 0 ? "Import completed with errors" : "Import successful",
        description,
        variant: errors && errors.length > 0 ? "default" : "default",
      });
      
      // Invalidate all queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/installments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/investments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Import failed",
        description: error.message || "Failed to import data",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsImporting(false);
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JSON file",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        // Validate that the data has the expected structure
        if (!data.accounts && !data.transactions && !data.budgets && 
            !data.installments && !data.goals && !data.investments) {
          throw new Error("Invalid data format - no recognizable data found");
        }

        // Trigger the import mutation
        importMutation.mutate(data);
      } catch (error: any) {
        toast({
          title: "Invalid file",
          description: error.message || "Failed to parse JSON file",
          variant: "destructive",
        });
        setIsImporting(false);
      }
    };

    reader.onerror = () => {
      toast({
        title: "File read error",
        description: "Failed to read the file",
        variant: "destructive",
      });
      setIsImporting(false);
    };

    reader.readAsText(file);
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const exportAsJSON = () => {
    const data = {
      accounts: accounts || [],
      transactions: transactions || [],
      budgets: budgets || [],
      installments: installments || [],
      goals: goals || [],
      investments: investments || [],
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `finance-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Export successful",
      description: "Your data has been exported as JSON",
    });
  };

  const convertToCSV = (data: any[], headers: string[]) => {
    const rows = [headers.join(",")];
    
    data.forEach(item => {
      const values = headers.map(header => {
        const value = item[header];
        if (value === null || value === undefined) return "";
        const stringValue = String(value);
        if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      });
      rows.push(values.join(","));
    });

    return rows.join("\n");
  };

  const exportAsCSV = () => {
    const allData: any[] = [];
    
    // Combine all data with type labels and all relational fields preserved
    if (accounts && accounts.length > 0) {
      accounts.forEach(acc => {
        allData.push({
          dataType: 'Account',
          id: acc.id,
          name: acc.name,
          type: acc.type,
          amount: acc.balance,
          accountId: '',
          category: '',
          description: '',
          date: '',
          status: '',
          creditLimit: acc.creditLimit || '',
          savingsRate: '',
          month: '',
          year: '',
          term: '',
          monthsPaid: '',
          targetAmount: '',
          currentAmount: '',
          deadline: '',
          initialAmount: '',
          currentValue: '',
        });
      });
    }

    if (transactions && transactions.length > 0) {
      transactions.forEach(txn => {
        allData.push({
          dataType: 'Transaction',
          id: txn.id,
          name: '',
          type: txn.type,
          amount: txn.amount,
          accountId: txn.accountId || '',
          category: txn.category || '',
          description: txn.description || '',
          date: txn.date,
          status: '',
          creditLimit: '',
          savingsRate: '',
          month: '',
          year: '',
          term: '',
          monthsPaid: '',
          targetAmount: '',
          currentAmount: '',
          deadline: '',
          initialAmount: '',
          currentValue: '',
        });
      });
    }

    if (budgets && budgets.length > 0) {
      budgets.forEach(budget => {
        allData.push({
          dataType: 'Budget',
          id: budget.id,
          name: '',
          type: '',
          amount: budget.monthlySalary,
          accountId: budget.accountId || '',
          category: '',
          description: '',
          date: '',
          status: budget.status,
          creditLimit: '',
          savingsRate: budget.savingsRate,
          month: budget.month,
          year: budget.year,
          term: '',
          monthsPaid: '',
          targetAmount: '',
          currentAmount: '',
          deadline: '',
          initialAmount: '',
          currentValue: '',
        });
      });
    }

    if (installments && installments.length > 0) {
      installments.forEach(inst => {
        allData.push({
          dataType: 'Installment',
          id: inst.id,
          name: inst.name,
          type: '',
          amount: inst.monthlyAmount,
          accountId: inst.accountId || '',
          category: '',
          description: '',
          date: '',
          status: inst.status,
          creditLimit: '',
          savingsRate: '',
          month: '',
          year: '',
          term: inst.term,
          monthsPaid: inst.monthsPaid,
          targetAmount: '',
          currentAmount: '',
          deadline: '',
          initialAmount: '',
          currentValue: '',
        });
      });
    }

    if (goals && goals.length > 0) {
      goals.forEach(goal => {
        allData.push({
          dataType: 'Goal',
          id: goal.id,
          name: goal.name,
          type: '',
          amount: '',
          accountId: goal.accountId || '',
          category: '',
          description: '',
          date: '',
          status: '',
          creditLimit: '',
          savingsRate: '',
          month: '',
          year: '',
          term: '',
          monthsPaid: '',
          targetAmount: goal.targetAmount,
          currentAmount: goal.currentAmount,
          deadline: goal.deadline,
          initialAmount: '',
          currentValue: '',
        });
      });
    }

    if (investments && investments.length > 0) {
      investments.forEach(inv => {
        allData.push({
          dataType: 'Investment',
          id: inv.id,
          name: inv.name,
          type: inv.type,
          amount: '',
          accountId: inv.accountId || '',
          category: '',
          description: '',
          date: '',
          status: '',
          creditLimit: '',
          savingsRate: '',
          month: '',
          year: '',
          term: '',
          monthsPaid: '',
          targetAmount: '',
          currentAmount: '',
          deadline: '',
          initialAmount: inv.initialAmount,
          currentValue: inv.currentValue,
        });
      });
    }

    const headers = [
      "dataType", "id", "name", "type", "amount", "accountId", "category", "description", 
      "date", "status", "creditLimit", "savingsRate", "month", "year", "term", 
      "monthsPaid", "targetAmount", "currentAmount", "deadline", "initialAmount", "currentValue"
    ];
    const csvContent = convertToCSV(allData, headers);

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `finance-data-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Export successful",
      description: `Exported ${allData.length} records as CSV`,
    });
  };

  const totalRecords = 
    (accounts?.length || 0) + 
    (transactions?.length || 0) + 
    (budgets?.length || 0) + 
    (installments?.length || 0) + 
    (goals?.length || 0) + 
    (investments?.length || 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold" data-testid="text-settings-title">Settings</h1>
        <p className="text-muted-foreground">Manage your application settings and data</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Data
          </CardTitle>
          <CardDescription>
            Restore your financial data from a previously exported JSON file. This will add the imported data to your existing records.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
                data-testid="input-file-import"
              />
              <FileJson className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold mb-2">Upload JSON File</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Select a JSON file exported from this application
              </p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                data-testid="button-choose-file"
              >
                <Upload className="h-4 w-4 mr-2" />
                {isImporting ? "Importing..." : "Choose File"}
              </Button>
            </div>
            
            <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Note:</strong> Importing will add new records to your database. Existing records will not be modified or deleted. Make sure to backup your current data before importing.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Data
          </CardTitle>
          <CardDescription>
            Download all your financial data to keep a local backup. You have {totalRecords} records across all categories.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileJson className="h-4 w-4" />
                  JSON Format
                </CardTitle>
                <CardDescription className="text-sm">
                  Complete data export including all fields and relationships
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={exportAsJSON} 
                  className="w-full"
                  data-testid="button-export-json"
                >
                  <FileJson className="h-4 w-4 mr-2" />
                  Export as JSON
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  CSV Format
                </CardTitle>
                <CardDescription className="text-sm">
                  Spreadsheet-ready format for analysis (use JSON for complete backup)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={exportAsCSV} 
                  className="w-full"
                  variant="outline"
                  data-testid="button-export-csv"
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export as CSV
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="mt-4 p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Data Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Accounts:</span>{" "}
                <span className="font-semibold" data-testid="text-accounts-count">{accounts?.length || 0}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Transactions:</span>{" "}
                <span className="font-semibold" data-testid="text-transactions-count">{transactions?.length || 0}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Budgets:</span>{" "}
                <span className="font-semibold" data-testid="text-budgets-count">{budgets?.length || 0}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Installments:</span>{" "}
                <span className="font-semibold" data-testid="text-installments-count">{installments?.length || 0}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Goals:</span>{" "}
                <span className="font-semibold" data-testid="text-goals-count">{goals?.length || 0}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Investments:</span>{" "}
                <span className="font-semibold" data-testid="text-investments-count">{investments?.length || 0}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About Local Storage</CardTitle>
          <CardDescription>
            Your data is currently stored in a PostgreSQL database on Replit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            This application uses a cloud database to store your financial data. You can export your data at any time using the options above to keep a local backup.
          </p>
          <p className="text-sm text-muted-foreground">
            The database ensures your data is persistent and accessible across sessions. Regular backups via export are recommended for data safety.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
