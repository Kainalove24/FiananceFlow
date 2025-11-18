import { MonthlySpendingChart } from "../MonthlySpendingChart";

export default function MonthlySpendingChartExample() {
  const data = [
    { month: "Jan", income: 5000, expenses: 3200 },
    { month: "Feb", income: 5200, expenses: 3400 },
    { month: "Mar", income: 4800, expenses: 3100 },
    { month: "Apr", income: 5400, expenses: 3600 },
    { month: "May", income: 5100, expenses: 3300 },
    { month: "Jun", income: 5430, expenses: 3210 },
  ];

  return (
    <div className="p-4">
      <MonthlySpendingChart data={data} />
    </div>
  );
}
