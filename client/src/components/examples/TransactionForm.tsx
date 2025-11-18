import { TransactionForm } from "../TransactionForm";

export default function TransactionFormExample() {
  return (
    <div className="p-4 max-w-md">
      <TransactionForm
        onSubmit={(transaction) => console.log("Transaction submitted:", transaction)}
        onCancel={() => console.log("Form cancelled")}
      />
    </div>
  );
}
