import React from 'react';

export const StatusBadge = ({ status, type = 'order' }) => {
  const getBadgeStyle = () => {
    switch (status) {
      case 'ORDER_PLACED':
      case 'PLACED':
      case 'PENDING':
      case 'PENDING_CONFIRMATION':
        return 'bg-amber-100/80 text-amber-900 border-amber-300 shadow-sm';
      case 'CONFIRMED':
      case 'PROCESSING':
      case 'PACKED':
        return 'bg-emerald-100/80 text-emerald-900 border-emerald-300 shadow-sm';
      case 'SHIPPED':
      case 'OUT_FOR_DELIVERY':
      case 'QUOTED':
        return 'bg-teal-100/80 text-teal-900 border-teal-300 shadow-sm';
      case 'DELIVERED':
      case 'ACTIVE':
      case 'APPROVED':
      case 'PAID':
        return 'bg-emerald-500 text-white border-emerald-600 shadow-sm shadow-emerald-500/20';
      case 'CANCELLED':
      case 'REJECTED':
      case 'DISCONTINUED':
      case 'FAILED':
        return 'bg-rose-100 text-rose-800 border-rose-300 shadow-sm';
      case 'OUT_OF_STOCK':
        return 'bg-rose-50 text-rose-700 border-rose-200 shadow-sm';
      case 'LOW_STOCK':
        return 'bg-amber-50 text-amber-800 border-amber-200 shadow-sm';
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
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-wide border uppercase ${getBadgeStyle()}`}
    >
      {formatText(status)}
    </span>
  );
};

export default StatusBadge;
