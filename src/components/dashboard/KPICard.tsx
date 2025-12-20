import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'success' | 'warning' | 'danger' | 'info';
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function KPICard({ title, value, subtitle, icon: Icon, variant = 'info', trend }: KPICardProps) {
  const variantClasses = {
    success: 'kpi-success',
    warning: 'kpi-warning',
    danger: 'kpi-danger',
    info: 'kpi-info',
  };

  const iconBgClasses = {
    success: 'bg-kpi-success/10 text-kpi-success',
    warning: 'bg-kpi-warning/10 text-kpi-warning',
    danger: 'bg-kpi-danger/10 text-kpi-danger',
    info: 'bg-kpi-info/10 text-kpi-info',
  };

  return (
    <div className={cn(
      "bg-card rounded-xl p-5 shadow-sm animate-fade-in",
      variantClasses[variant]
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-bold text-card-foreground">{value}</p>
          {subtitle && (
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          )}
          {trend && (
            <p className={cn(
              "mt-2 text-sm font-medium",
              trend.isPositive ? "text-kpi-success" : "text-kpi-danger"
            )}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}% vs mes anterior
            </p>
          )}
        </div>
        <div className={cn(
          "flex h-12 w-12 items-center justify-center rounded-xl",
          iconBgClasses[variant]
        )}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
