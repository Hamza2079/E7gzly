import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon?: React.ReactNode;
}

export default function StatsCard({ title, value, change, trend = "neutral", icon }: StatsCardProps) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        {icon && <div className="rounded-lg bg-blue-50 p-2 text-blue-600">{icon}</div>}
      </div>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
      {change && (
        <p
          className={cn(
            "mt-1 text-xs font-medium",
            trend === "up" && "text-green-600",
            trend === "down" && "text-red-600",
            trend === "neutral" && "text-gray-500"
          )}
        >
          {change}
        </p>
      )}
    </div>
  );
}
