import { TransactionTable } from "../TransactionTable";

export default function TransactionTableExample() {
  const transactions = [
    {
      id: 1,
      date: new Date("2025-01-15"),
      description: "Monthly Salary",
      category: "Salary",
      amount: 5000,
      type: "income",
      accountName: "Main Checking",
    },
    {
      id: 2,
      date: new Date("2025-01-10"),
      description: "Grocery Shopping",
      category: "Groceries",
      amount: 150.50,
      type: "variable",
      accountName: "Main Checking",
    },
    {
      id: 3,
      date: new Date("2025-01-05"),
      description: "Rent Payment",
      category: "Housing",
      amount: 1200,
      type: "fixed",
      accountName: "Main Checking",
    },
  ];

  return (
    <div className="p-4">
      <TransactionTable
        transactions={transactions}
        onEdit={(id) => console.log("Edit transaction", id)}
        onDelete={(id) => console.log("Delete transaction", id)}
      />
    </div>
  );
}
