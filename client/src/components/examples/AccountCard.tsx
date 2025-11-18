import { AccountCard } from "../AccountCard";

export default function AccountCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
      <AccountCard
        id={1}
        name="Main Checking"
        type="bank"
        balance={2450.75}
        onEdit={(id) => console.log("Edit account", id)}
      />
      <AccountCard
        id={2}
        name="Chase Freedom"
        type="credit_card"
        balance={-850.00}
        creditLimit={5000}
        onEdit={(id) => console.log("Edit account", id)}
      />
      <AccountCard
        id={3}
        name="Cash Wallet"
        type="cash"
        balance={320.50}
        onEdit={(id) => console.log("Edit account", id)}
      />
    </div>
  );
}
