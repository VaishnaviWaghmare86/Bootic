import React, { useState, useEffect } from 'react';
import { Boxes, Plus, Sliders, History, AlertTriangle, CheckCircle } from 'lucide-react';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';

export const InventoryManager = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [actionType, setActionType] = useState('stock-in'); // 'stock-in' or 'adjust'
  const [showModal, setShowModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [filterLowStock, setFilterLowStock] = useState(false);

  const [formData, setFormData] = useState({
    quantity: 50,
    supplier_name: 'Surat Mills',
    batch_number: 'BATCH-2026-09',
    reason: 'Count Reconciliation',
    notes: '',
  });

  const fetchInventory = async () => {
    try {
      setLoading(true);
      let url = '/inventory?limit=100';
      if (filterLowStock) url += '&low_stock_only=true';
      const res = await api.get(url);
      if (res.data.success) {
        setInventory(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [filterLowStock]);

  const openActionModal = (item, type) => {
    setSelectedProduct(item);
    setActionType(type);
    setFormData({
      quantity: 50,
      supplier_name: 'Surat Mills',
      batch_number: `BATCH-${new Date().getFullYear()}-${new Date().getMonth() + 1}`,
      reason: 'Physical Count Adjustment',
      notes: '',
    });
    setShowModal(true);
  };

  const openHistory = async (item) => {
    setSelectedProduct(item);
    setShowHistoryModal(true);
    try {
      const res = await api.get(`/inventory/history/${item.product_id}`);
      if (res.data.success) {
        setHistoryLogs(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleActionSubmit = async (e) => {
    e.preventDefault();
    try {
      if (actionType === 'stock-in') {
        await api.post('/inventory/stock-in', {
          product_id: selectedProduct.product_id,
          quantity: parseInt(formData.quantity),
          supplier_name: formData.supplier_name,
          batch_number: formData.batch_number,
          notes: formData.notes,
        });
      } else {
        await api.post('/inventory/stock-adjustment', {
          product_id: selectedProduct.product_id,
          adjustment_quantity: parseInt(formData.quantity),
          reason: formData.reason,
          notes: formData.notes,
        });
      }
      setShowModal(false);
      fetchInventory();
    } catch (err) {
      alert(err.response?.data?.message || 'Inventory action failed');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Warehouse Inventory & Stock Control
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor real-time warehouse available stock, reserved units for orders, and log stock-in batches.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setFilterLowStock(!filterLowStock)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
              filterLowStock
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-white text-slate-700 border-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 inline mr-1 text-amber-600" />
            {filterLowStock ? 'Showing Low Stock Only' : 'Filter Low Stock'}
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
            <tr>
              <th className="p-4">SKU / Product Name</th>
              <th className="p-4">Available Stock</th>
              <th className="p-4">Reserved (Orders)</th>
              <th className="p-4">Total Warehouse Stock</th>
              <th className="p-4">Alert Status</th>
              <th className="p-4 text-right">Stock Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {inventory.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/50">
                <td className="p-4">
                  <span className="font-extrabold text-rose-600 text-[10px] block">{item.sku}</span>
                  <strong className="text-slate-900 font-bold">{item.product_name}</strong>
                </td>
                <td className="p-4">
                  <span
                    className={`text-sm font-black ${
                      item.available_stock <= 0
                        ? 'text-rose-600'
                        : item.is_low_stock
                        ? 'text-amber-600'
                        : 'text-emerald-700'
                    }`}
                  >
                    {item.available_stock} pcs
                  </span>
                </td>
                <td className="p-4 font-bold text-slate-600">{item.reserved_stock} pcs</td>
                <td className="p-4 font-extrabold text-slate-900">{item.total_stock} pcs</td>
                <td className="p-4">
                  {item.is_out_of_stock ? (
                    <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-full font-bold text-[10px]">
                      Out of Stock
                    </span>
                  ) : item.is_low_stock ? (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-bold text-[10px]">
                      Low Stock (Threshold: {item.low_stock_threshold})
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">
                      Healthy
                    </span>
                  )}
                </td>
                <td className="p-4 text-right space-x-2">
                  <button
                    onClick={() => openActionModal(item, 'stock-in')}
                    className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-bold"
                  >
                    + Stock In
                  </button>
                  <button
                    onClick={() => openActionModal(item, 'adjust')}
                    className="px-2.5 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-bold"
                  >
                    Adjust
                  </button>
                  <button
                    onClick={() => openHistory(item)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                    title="Movement Logs"
                  >
                    <History className="w-4 h-4 inline" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Stock In / Adjustment Modal */}
      {showModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-xs">
            <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
              {actionType === 'stock-in' ? 'Receive Stock In Batch' : 'Manual Stock Adjustment'}
            </h3>
            <p className="text-slate-500 mt-2">
              Product: <strong>{selectedProduct.product_name}</strong> ({selectedProduct.sku})
            </p>

            <form onSubmit={handleActionSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {actionType === 'stock-in' ? 'Batch Quantity (Pieces)' : 'Adjustment (+ or - Quantity)'}
                </label>
                <input
                  type="number"
                  required
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-900"
                />
              </div>

              {actionType === 'stock-in' ? (
                <>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Supplier / Factory</label>
                    <input
                      type="text"
                      value={formData.supplier_name}
                      onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                      placeholder="Surat Mills / Bhiwandi Unit"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Batch / Lot Number</label>
                    <input
                      type="text"
                      value={formData.batch_number}
                      onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Reason for Adjustment</label>
                  <input
                    type="text"
                    required
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="Damaged, Count error, Quality check"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  />
                </div>
              )}

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 rounded-xl font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 text-white rounded-xl font-bold shadow-md shadow-rose-500/20"
                >
                  Confirm Stock Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Movement History Logs Modal */}
      {showHistoryModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[85vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Stock Movement Trace Logs: {selectedProduct.product_name}
              </h3>
              <button onClick={() => setShowHistoryModal(false)} className="text-slate-400">✕</button>
            </div>

            <div className="mt-4 divide-y divide-slate-100">
              {historyLogs.map((log) => (
                <div key={log.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900">{log.action}</span>
                    <p className="text-[10px] text-slate-400">
                      {new Date(log.created_at).toLocaleString()} • By {log.performed_by}
                    </p>
                    {log.notes && <p className="text-slate-600 mt-0.5">{log.notes}</p>}
                  </div>
                  <div className="text-right">
                    <span
                      className={`font-black text-sm ${
                        log.quantity_change > 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {log.quantity_change > 0 ? `+${log.quantity_change}` : log.quantity_change} pcs
                    </span>
                    <span className="block text-[10px] text-slate-400">
                      Avail: {log.new_available} | Res: {log.new_reserved}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManager;
