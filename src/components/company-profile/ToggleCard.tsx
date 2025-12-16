import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface ToggleCardProps {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export function ToggleCard({
  label,
  description,
  checked,
  onCheckedChange,
  icon,
  disabled = false,
}: ToggleCardProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between p-4 rounded-lg border transition-colors",
        checked ? "border-primary bg-primary/5" : "border-border bg-card",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <div className={cn(
            "p-2 rounded-md",
            checked ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
          )}>
            {icon}
          </div>
        )}
        <div>
          <h4 className="text-sm font-medium text-foreground">{label}</h4>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
    </div>
  );
}
