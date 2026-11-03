import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Send,
  AlertCircle
} from 'lucide-react';
import {
  PAYMENT_STATUS_CONFIG,
  VERIFICATION_STATUS_CONFIG,
  NOTIFICATION_STATUS_CONFIG,
  getOverdueSeverityStyle
} from '../../utils/statusHelpers';

/**
 * Komponen Reusable Badge Status Terstandarisasi
 * @param {{
 *   status: string,
 *   type?: 'payment'|'verification'|'notification',
 *   overdueDays?: number,
 *   showIcon?: boolean,
 *   size?: 'sm'|'md'
 * }} props
 */
export default function StatusBadge({
  status,
  type = 'payment',
  overdueDays = 0,
  showIcon = true,
  size = 'md'
}) {
  let config = null;
  let IconComponent = HelpCircle;

  if (type === 'payment') {
    config = PAYMENT_STATUS_CONFIG[status] || {
      label: status,
      colorClasses: 'bg-slate-100 text-slate-700 border-slate-200',
    };
    if (status === 'Paid') IconComponent = CheckCircle2;
    else if (status === 'Partial') IconComponent = Clock;
    else if (status === 'Unpaid') IconComponent = AlertCircle;
    else if (status === 'Overdue') IconComponent = AlertTriangle;
  } else if (type === 'verification') {
    config = VERIFICATION_STATUS_CONFIG[status] || {
      label: status,
      colorClasses: 'bg-slate-100 text-slate-700 border-slate-200',
    };
    if (status === 'Verified') IconComponent = CheckCircle2;
    else if (status === 'Pending') IconComponent = Clock;
    else if (status === 'Rejected') IconComponent = XCircle;
  } else if (type === 'notification') {
    config = NOTIFICATION_STATUS_CONFIG[status] || {
      label: status,
      colorClasses: 'bg-slate-100 text-slate-700 border-slate-200',
    };
    if (status === 'Sent' || status === 'Terkirim') IconComponent = Send;
    else if (status === 'Failed' || status === 'Gagal') IconComponent = XCircle;
    else IconComponent = Clock;
  }

  // Jika Overdue dengan detail jumlah hari keterlambatan
  let customClass = config.colorClasses;
  let customLabel = config.label;

  if (type === 'payment' && status === 'Overdue' && overdueDays > 0) {
    const severity = getOverdueSeverityStyle(overdueDays);
    customClass = severity.badgeClass;
    customLabel = `Overdue (${overdueDays} Hari)`;
  }

  const sizeClasses = size === 'sm'
    ? 'px-2 py-0.5 text-xs gap-1'
    : 'px-2.5 py-1 text-xs font-medium gap-1.5';

  return (
    <span
      className={`inline-flex items-center rounded-full border transition-colors ${sizeClasses} ${customClass}`}
      role="status"
      aria-label={customLabel}
    >
      {showIcon && <IconComponent className={size === 'sm' ? 'w-3 h-3 shrink-0' : 'w-3.5 h-3.5 shrink-0'} />}
      <span>{customLabel}</span>
    </span>
  );
}

