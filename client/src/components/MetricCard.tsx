import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon?: LucideIcon;
  "data-testid"?: string;
}

export function MetricCard({ title, value, trend, icon: Icon, "data-testid": testId }: MetricCardProps) {
  return (
    <Card data-testid={testId}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && <Icon className="w-5 h-5 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-mono" data-testid={`text-${title.toLowerCase().replace(/\s+/g, "-")}-value`}>₱{value}</div>
        {trend && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
            {trend.isPositive ? (
              <TrendingUp className="w-3 h-3 text-chart-2" />
            ) : (
              <TrendingDown className="w-3 h-3 text-destructive" />
            )}
            <span className={trend.isPositive ? "text-chart-2" : "text-destructive"}>
              {trend.value}%
            </span>
            <span>vs last month</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
