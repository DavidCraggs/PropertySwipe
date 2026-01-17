import { Clock, CheckCircle, AlertTriangle, XCircle, FileText, Send } from 'lucide-react';
import type { AgreementStatus } from '../../types';

interface AgreementStatusBadgeProps {
  status: AgreementStatus;
  size?: 'sm' | 'md';
}

const statusConfig: Record<
  AgreementStatus,
  {
    label: string;
    icon: typeof Clock;
    bgColor: string;
    textColor: string;
    iconColor: string;
  }
> = {
  draft: {
    label: 'Draft',
    icon: FileText,
    bgColor: 'bg-neutral-100',
    textColor: 'text-neutral-700',
    iconColor: 'text-neutral-500',
  },
  pending_signatures: {
    label: 'Awaiting Signatures',
    icon: Send,
    bgColor: 'bg-warning-100',
    textColor: 'text-warning-700',
    iconColor: 'text-warning-500',
  },
  partially_signed: {
    label: 'Partially Signed',
    icon: Clock,
    bgColor: 'bg-primary-100',
    textColor: 'text-primary-700',
    iconColor: 'text-primary-500',
  },
  fully_signed: {
    label: 'Fully Signed',
    icon: CheckCircle,
    bgColor: 'bg-success-100',
    textColor: 'text-success-700',
    iconColor: 'text-success-500',
  },
  expired: {
    label: 'Expired',
    icon: AlertTriangle,
    bgColor: 'bg-danger-100',
    textColor: 'text-danger-700',
    iconColor: 'text-danger-500',
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    bgColor: 'bg-neutral-100',
    textColor: 'text-neutral-600',
    iconColor: 'text-neutral-400',
  },
};

export function AgreementStatusBadge({ status, size = 'md' }: AgreementStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';
  const iconSize = size === 'sm' ? 12 : 14;

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full font-medium
        ${config.bgColor} ${config.textColor} ${sizeClasses}
      `}
    >
      <Icon size={iconSize} className={config.iconColor} />
      {config.label}
    </span>
  );
}
