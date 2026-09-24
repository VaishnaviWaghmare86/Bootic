import React, { useState, useEffect } from 'react';
import { Boxes, Plus, Sliders, History, AlertTriangle, CheckCircle, Sparkles, X, ArrowUpRight } from 'lucide-react';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';

export const InventoryManager = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [actionType, setActionType] = useState('stock-in');
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
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-emerald-900/10 gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 text-[11px] font-black uppercase tracking-widest shadow-sm">
            <Boxes className="w-3.5 h-3.5 text-emerald-600" />
            <span>Warehouse Stock Audit</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2">
            Warehouse Inventory & Batch Movements
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time stock reservation, low stock safety alerts, batch intake, and audit logging.
          </p>
        </div>

        {/* Quick Filter Pill */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterLowStock(!filterLowStock)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all ${
              filterLowStock
                ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/25'
                : 'bg-white text-slate-700 border border-slate-200 hover:border-emerald-300 shadow-sm'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            {filterLowStock ? 'Showing Low Stock Only' : 'Filter Low Stock Alert'}
          </button>
        </div>
      </div>

      {/* Inventory Table Card */}
      <div className="bootic-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f2f8f5] border-b border-emerald-900/10 text-emerald-900 font-black uppercase tracking-wider">
              <tr>
                <th className="p-4">SKU / Garment Style</th>
                <th className="p-4">Total Stock</th>
                <th className="p-4">Reserved (Orders)</th>
                <th className="p-4">Available for Sale</th>
                <th className="p-4">Safety Threshold</th>
                <th className="p-4">Stock Status</th>
                <th className="p-4 text-right">Warehouse Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-900/5">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400 font-bold">
                    Loading inventory records...
                  </td>
                </tr>
              ) : inventory.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400 font-bold">
                    No inventory records found.
                  </td>
                </tr>
              ) : (
                inventory.map((item) => (
                  <tr key={item.id} className="hover:bg-emerald-50/40 transition-colors">
                    <td className="p-4">
                      <p className="font-black text-slate-900 text-sm">{item.product_name}</p>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 border border-emerald-200 px-2 py-0.5 rounded-md mt-0.5 inline-block">
                        SKU: {item.sku}
                      </span>
                    </td>
                    <td className="p-4 font-black text-slate-900 text-sm">
                      {item.total_stock} pcs
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 font-bold text-xs">
                        {item.reserved_stock} pcs
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-100/80 border border-emerald-300 text-emerald-900 font-black text-xs">
                        {item.available_stock} pcs
                      </span>
                    </td>
                    <td className="p-4 text-slate-600 font-bold">
                      {item.low_stock_threshold} pcs
                    </td>
                    <td className="p-4">
                      <StatusBadge
                        status={
                          item.is_out_of_stock
                            ? 'OUT_OF_STOCK'
                            : item.is_low_stock
                            ? 'LOW_STOCK'
                            : 'ACTIVE'
                        }
                      />
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openActionModal(item, 'stock-in')}
                          className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-xs font-black shadow-sm hover:opacity-90"
                        >
                          + Stock-In
                        </button>
                        <button
                          onClick={() => openActionModal(item, 'adjust')}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                        >
                          Adjust
                        </button>
                        <button
                          onClick={() => openHistory(item)}
                          className="p-1.5 text-slate-400 hover:text-emerald-700 rounded-lg"
                          title="Movement History"
                        >
                          <History className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock In / Adjustment Modal */}
      {showModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-emerald-500/30">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Boxes className="w-5 h-5 text-emerald-600" />
                {actionType === 'stock-in' ? 'Receive Stock Intake' : 'Manual Stock Count Adjustment'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mt-2 font-medium">
              Product: <strong className="text-slate-900">{selectedProduct.product_name}</strong> ({selectedProduct.sku})
            </p>

            <form onSubmit={handleActionSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Quantity ({actionType === 'adjust' ? '+ or -' : 'Pieces to Add'})
                </label>
                <input
                  type="number"
                  required
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              {actionType === 'stock-in' ? (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Supplier / Mill Name
                    </label>
                    <input
                      type="text"
                      value={formData.supplier_name}
                      onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Batch / PO Number
                    </label>
                    <input
                      type="text"
                      value={formData.batch_number}
                      onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Adjustment Reason
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="e.g. Damage during transport, Count correction"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Internal Notes
                </label>
                <textarea
                  rows="2"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional delivery/rack details..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black rounded-xl text-xs shadow-md shadow-emerald-500/20"
                >
                  Confirm Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Movement History Modal */}
      {showHistoryModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-emerald-500/30 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-600" />
                Inventory Movement Audit Trail
              </h2>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2 font-medium">
              Product: <strong className="text-slate-900">{selectedProduct.product_name}</strong> ({selectedProduct.sku})
            </p>

            <div className="mt-4 space-y-2">
              {historyLogs.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No movement logs recorded yet.</p>
              ) : (
                historyLogs.map((log) => (
                  <div key={log.id} className="p-3 bg-emerald-50/40 rounded-xl border border-emerald-100 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-black text-slate-900 block">{log.action}</span>
                      <span className="text-[10px] text-slate-400 font-semibold">{new Date(log.created_at).toLocaleString()}</span>
                    </div>
                    <div className="text-right">
                      <span className={`font-black text-xs ${log.quantity_change >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {log.quantity_change >= 0 ? `+${log.quantity_change}` : log.quantity_change} pcs
                      </span>
                      <span className="block text-[10px] text-slate-500 font-medium">Available: {log.new_available}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManager;
