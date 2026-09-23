import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, TrendingUp, MapPin, Package, DollarSign, Boxes } from 'lucide-react';
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
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-500 font-semibold">
        Generating business intelligence reports...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Sales Analytics & Inventory Valuation
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Detailed breakdown of revenue by city, top-selling wholesale styles, average order sizes, and total stock assets.
        </p>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Total Wholesale Revenue
          </span>
          <p className="text-2xl font-black text-rose-600 mt-2">
            ₹{salesReport?.total_revenue?.toLocaleString()}
          </p>
          <span className="text-xs text-slate-500 mt-1 block">
            Across {salesReport?.total_orders} orders • Avg Order: ₹{salesReport?.average_order_value?.toLocaleString()}
          </span>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Warehouse Asset Valuation
          </span>
          <p className="text-2xl font-black text-emerald-600 mt-2">
            ₹{inventoryReport?.estimated_wholesale_valuation?.toLocaleString()}
          </p>
          <span className="text-xs text-slate-500 mt-1 block">
            {inventoryReport?.total_quantity_in_stock?.toLocaleString()} total wholesale pieces in stock
          </span>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Active Product Catalog
          </span>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {inventoryReport?.total_skus} Active Styles
          </p>
          <span className="text-xs text-slate-500 mt-1 block">
            {inventoryReport?.total_available_quantity?.toLocaleString()} pieces ready for immediate dispatch
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sales by Regional City */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-rose-600" /> Revenue Distribution by City
          </h3>

          {salesReport?.sales_by_city?.length === 0 ? (
            <p className="text-xs text-slate-500 py-6">No city data available yet.</p>
          ) : (
            <div className="space-y-3">
              {salesReport?.sales_by_city?.map((item, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between text-xs">
                  <div>
                    <strong className="text-slate-900 font-bold block">{item.city}</strong>
                    <span className="text-[10px] text-slate-500">{item.order_count} wholesale orders</span>
                  </div>
                  <strong className="text-sm font-black text-slate-900">
                    ₹{item.total_revenue?.toLocaleString()}
                  </strong>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Selling Products */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" /> Top Selling Garment Styles
          </h3>

          {salesReport?.top_products?.length === 0 ? (
            <p className="text-xs text-slate-500 py-6">No sales recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {salesReport?.top_products?.map((item, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] font-extrabold text-rose-600">{item.sku}</span>
                    <strong className="text-slate-900 font-bold block">{item.product_name}</strong>
                    <span className="text-[10px] text-slate-500">{item.units_sold} pieces sold</span>
                  </div>
                  <strong className="text-sm font-black text-slate-900">
                    ₹{item.total_revenue?.toLocaleString()}
                  </strong>
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
