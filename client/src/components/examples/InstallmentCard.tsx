import { InstallmentCard } from "../InstallmentCard";

export default function InstallmentCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
      <InstallmentCard
        id={1}
        name="Laptop Purchase"
        monthlyAmount={250.00}
        monthsPaid={6}
        term={12}
        status="active"
      />
      <InstallmentCard
        id={2}
        name="Car Loan"
        monthlyAmount={450.00}
        monthsPaid={18}
        term={36}
        status="active"
      />
      <InstallmentCard
        id={3}
        name="Phone"
        monthlyAmount={80.00}
        monthsPaid={24}
        term={24}
        status="done"
      />
    </div>
  );
}
