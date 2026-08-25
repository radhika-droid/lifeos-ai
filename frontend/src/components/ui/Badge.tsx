interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'priority';
  priority?: number;
  children: React.ReactNode;
  className?: string;
}

const PRIORITY_STYLES: Record<number, string> = {
  1: 'bg-priority-1/15 text-priority-1 border-priority-1/20',
  2: 'bg-priority-2/15 text-priority-2 border-priority-2/20',
  3: 'bg-priority-3/15 text-priority-3 border-priority-3/20',
  4: 'bg-priority-4/15 text-priority-4 border-priority-4/20',
  5: 'bg-priority-5/15 text-priority-5 border-priority-5/20',
};

const VARIANT_STYLES: Record<string, string> = {
  default: 'bg-white/5 text-text-secondary border-border-default',
  success: 'bg-success/15 text-success border-success/20',
  warning: 'bg-warning/15 text-warning border-warning/20',
  danger: 'bg-danger/15 text-danger border-danger/20',
  info: 'bg-info/15 text-info border-info/20',
};

export default function Badge({ variant = 'default', priority, children, className = '' }: BadgeProps) {
  const style =
    variant === 'priority' && priority
      ? PRIORITY_STYLES[priority] || PRIORITY_STYLES[3]
      : VARIANT_STYLES[variant];

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md border ${style} ${className}`}
    >
      {children}
    </span>
  );
}

// Convenience: Energy badge
export function EnergyBadge({ level }: { level: string }) {
  const config: Record<string, { emoji: string; variant: BadgeProps['variant'] }> = {
    low: { emoji: '🔋', variant: 'success' },
    medium: { emoji: '⚡', variant: 'warning' },
    high: { emoji: '🔥', variant: 'danger' },
  };
  const { emoji, variant } = config[level] || config.medium;
  return (
    <Badge variant={variant}>
      {emoji} {level}
    </Badge>
  );
}

// Convenience: Status badge
export function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    pending: { label: 'Pending', variant: 'default' },
    in_progress: { label: 'In Progress', variant: 'info' },
    done: { label: 'Done', variant: 'success' },
  };
  const { label, variant } = config[status] || config.pending;
  return <Badge variant={variant}>{label}</Badge>;
}
