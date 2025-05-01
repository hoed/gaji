
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type BadgeType = 'payroll' | 'tax' | 'attendance';

interface CalendarBadgeProps {
  type: BadgeType;
  count?: number;
  className?: string;
}

const CalendarBadge = ({ type, count = 1, className }: CalendarBadgeProps) => {
  const getBadgeVariant = () => {
    switch (type) {
      case 'payroll':
        return 'success';
      case 'tax':
        return 'warning';
      case 'attendance':
        return 'info';
      default:
        return 'default';
    }
  };

  const getLabel = () => {
    switch (type) {
      case 'payroll':
        return 'Gaji';
      case 'tax':
        return 'Pajak';
      case 'attendance':
        return 'Kehadiran';
      default:
        return 'Event';
    }
  };

  return (
    <Badge 
      variant={getBadgeVariant()} 
      className={cn("text-xs rounded-sm px-1.5 py-0.5 font-medium", className)}
    >
      {count > 1 ? `${getLabel()} (${count})` : getLabel()}
    </Badge>
  );
};

export default CalendarBadge;
