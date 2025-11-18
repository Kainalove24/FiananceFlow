import { MetricCard } from "../MetricCard";
import { DollarSign, TrendingUp, Wallet } from "lucide-react";

export default function MetricCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
      <MetricCard
        title="Total Income"
        value="5,430.00"
        trend={{ value: 12.5, isPositive: true }}
        icon={TrendingUp}
      />
      <MetricCard
        title="Total Expenses"
        value="3,210.50"
        trend={{ value: 8.2, isPositive: false }}
        icon={DollarSign}
      />
      <MetricCard
        title="Remaining Budget"
        value="2,219.50"
        icon={Wallet}
      />
    </div>
  );
}
