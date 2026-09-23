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
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center gap-3 text-rose-800">
        <XCircle className="w-6 h-6 text-rose-600 flex-shrink-0" />
        <div>
          <h4 className="font-bold text-sm">Order Cancelled / Rejected</h4>
          <p className="text-xs text-rose-700">Reserved stock has been returned to inventory.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-slate-200 w-full z-0"></div>
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
                    ? 'bg-rose-600 border-rose-600 text-white shadow-md shadow-rose-200'
                    : 'bg-white border-slate-300 text-slate-400'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span
                className={`text-xs mt-2 font-medium ${
                  isCurrent
                    ? 'text-rose-600 font-bold'
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
