import React from 'react';
import { CheckCircle2, Clock, PackageCheck, Truck, Home, XCircle } from 'lucide-react';

export const OrderTracker = ({ currentStatus }) => {
  const isCancelled = currentStatus === 'CANCELLED' || currentStatus === 'REJECTED';

  const steps = [
    { key: 'ORDER_PLACED', label: 'Placed', icon: Clock },
    { key: 'CONFIRMED', label: 'Confirmed', icon: CheckCircle2 },
    { key: 'PROCESSING', label: 'Processing', icon: PackageCheck },
    { key: 'SHIPPED', label: 'Shipped', icon: Truck },
    { key: 'DELIVERED', label: 'Delivered', icon: Home },
  ];

  const statusOrder = [
    'ORDER_PLACED',
    'PENDING_CONFIRMATION',
    'CONFIRMED',
    'PROCESSING',
    'PACKED',
    'SHIPPED',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
  ];

  const currentIndex = statusOrder.indexOf(currentStatus);

  if (isCancelled) {
    return (
      <div className="bg-rose-50/80 border border-rose-200 rounded-2xl p-4 flex items-center gap-3 text-rose-800">
        <XCircle className="w-6 h-6 text-rose-600 flex-shrink-0" />
        <div>
          <h4 className="font-black text-xs uppercase tracking-wide">Order Cancelled / Released</h4>
          <p className="text-[11px] text-rose-700 font-medium">Reserved stock has been returned to inventory.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-emerald-100 w-full z-0"></div>
        {steps.map((step, idx) => {
          const stepIndex = statusOrder.indexOf(step.key);
          const isCompleted = currentIndex >= stepIndex;
          const isCurrent = currentStatus === step.key;
          const Icon = step.icon;

          return (
            <div key={step.key} className="relative z-10 flex flex-col items-center group">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                  isCompleted
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 border-emerald-600 text-white shadow-md shadow-emerald-500/25'
                    : 'bg-white border-slate-200 text-slate-400'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span
                className={`text-[11px] mt-2 font-black tracking-tight ${
                  isCurrent
                    ? 'text-emerald-800'
                    : isCompleted
                    ? 'text-slate-900'
                    : 'text-slate-400'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderTracker;
