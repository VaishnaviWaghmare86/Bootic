import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, TrendingUp, MapPin, Package, DollarSign, Boxes, Sparkles } from 'lucide-react';
import api from '../../api/client';

export const Reports = () => {
  const [salesReport, setSalesReport] = useState(null);
  const [inventoryReport, setInventoryReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const [sRes, iRes] = await Promise.all([
        api.get('/reports/sales'),
        api.get('/reports/inventory'),
      ]);
      if (sRes.data.success) setSalesReport(sRes.data.data);
      if (iRes.data.success) setInventoryReport(iRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-emerald-800 font-extrabold">
        Generating business intelligence analytics...
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-emerald-900/10 gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 text-[11px] font-black uppercase tracking-widest shadow-sm">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>Business Intelligence Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2">
            Wholesale Revenue Analytics & Asset Valuation
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Regional distribution metrics, fast-selling wholesale styles, and total warehouse capitalization.
          </p>
        </div>
      </div>

      {/* Top 3 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bootic-card p-6 bootic-card-hover">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              Total Wholesale Revenue
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              ₹
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-3">
            ₹{salesReport?.total_revenue?.toLocaleString()}
          </p>
          <span className="text-xs text-slate-500 mt-2 block font-medium">
            Across <strong className="text-emerald-700">{salesReport?.total_orders}</strong> orders • Avg Order: ₹{salesReport?.average_order_value?.toLocaleString()}
          </span>
        </div>

        <div className="bootic-card p-6 bootic-card-hover">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              Warehouse Asset Valuation
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-emerald-700 mt-3">
            ₹{inventoryReport?.estimated_wholesale_valuation?.toLocaleString()}
          </p>
          <span className="text-xs text-slate-500 mt-2 block font-medium">
            <strong className="text-slate-800">{inventoryReport?.total_quantity_in_stock?.toLocaleString()}</strong> total wholesale pieces in stock
          </span>
        </div>

        <div className="bootic-card p-6 bootic-card-hover">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              Active Catalog Depth
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-3">
            {inventoryReport?.total_skus} Active Styles
          </p>
          <span className="text-xs text-slate-500 mt-2 block font-medium">
            <strong className="text-emerald-700">{inventoryReport?.total_available_quantity?.toLocaleString()}</strong> pieces ready for immediate dispatch
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sales by Regional City */}
        <div className="bootic-card p-6 sm:p-8">
          <h3 className="text-base font-black text-slate-900 mb-6 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-600" /> Revenue Distribution by City
          </h3>

          {salesReport?.sales_by_city?.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No city transaction data available yet.</p>
          ) : (
            <div className="space-y-4">
              {salesReport?.sales_by_city?.map((item, idx) => (
                <div key={idx} className="p-3.5 bg-emerald-50/40 rounded-2xl border border-emerald-100/80">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-black text-slate-900">{item.city}</span>
                    <span className="font-black text-emerald-800">₹{item.total_revenue?.toLocaleString()}</span>
                  </div>
                  <div className="h-2 w-full bg-emerald-100/60 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                      style={{ width: `${Math.min(100, (item.total_revenue / (salesReport?.total_revenue || 1)) * 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold block mt-1">
                    {item.order_count} wholesale shipments delivered
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top-Selling Products */}
        <div className="bootic-card p-6 sm:p-8">
          <h3 className="text-base font-black text-slate-900 mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" /> Top-Selling Wholesale Styles
          </h3>

          {salesReport?.top_products?.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No product volume sales recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {salesReport?.top_products?.map((item, idx) => (
                <div key={idx} className="p-3.5 bg-emerald-50/40 rounded-2xl border border-emerald-100/80 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black text-slate-900">{item.product_name}</p>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 border border-emerald-200 px-2 py-0.5 rounded-md mt-0.5 inline-block">
                      SKU: {item.sku}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-slate-900 block">
                      {item.units_sold} pcs sold
                    </span>
                    <span className="text-[11px] font-black text-emerald-700">
                      ₹{item.total_revenue?.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
