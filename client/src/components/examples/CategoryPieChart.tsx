import { CategoryPieChart } from "../CategoryPieChart";

export default function CategoryPieChartExample() {
  const data = [
    { name: "Groceries", value: 850 },
    { name: "Utilities", value: 450 },
    { name: "Entertainment", value: 320 },
    { name: "Transport", value: 280 },
    { name: "Others", value: 310 },
  ];

  return (
    <div className="p-4">
      <CategoryPieChart data={data} />
    </div>
  );
}
