import React from 'react';

export const StatusBadge = ({ status, type = 'order' }) => {
  const getBadgeStyle = () => {
    switch (status) {
      case 'ORDER_PLACED':
      case 'PENDING':
      case 'PENDING_CONFIRMATION':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'CONFIRMED':
      case 'PROCESSING':
      case 'PACKED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'SHIPPED':
      case 'OUT_FOR_DELIVERY':
      case 'QUOTED':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'DELIVERED':
      case 'ACTIVE':
      case 'APPROVED':
      case 'PAID':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'CANCELLED':
      case 'REJECTED':
      case 'DISCONTINUED':
      case 'FAILED':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'OUT_OF_STOCK':
      case 'LOW_STOCK':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const formatText = (str) => {
    if (!str) return '';
    return str.replace(/_/g, ' ');
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getBadgeStyle()}`}
    >
      {formatText(status)}
    </span>
  );
};

export default StatusBadge;
