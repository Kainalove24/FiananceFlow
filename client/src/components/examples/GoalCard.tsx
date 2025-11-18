import { GoalCard } from "../GoalCard";

export default function GoalCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
      <GoalCard
        id={1}
        name="Emergency Fund"
        targetAmount={10000}
        currentAmount={6500}
        deadline={new Date("2025-12-31")}
        onDeposit={(id) => console.log("Deposit to goal", id)}
      />
      <GoalCard
        id={2}
        name="Vacation"
        targetAmount={3000}
        currentAmount={1200}
        deadline={new Date("2025-08-15")}
        onDeposit={(id) => console.log("Deposit to goal", id)}
      />
    </div>
  );
}
