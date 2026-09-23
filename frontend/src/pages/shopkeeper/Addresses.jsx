import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import api from '../../api/client';

export const Addresses = () => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    contact_person: '',
    business_name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    landmark: '',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411002',
    is_default: false,
  });

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/addresses');
      if (res.data.success) {
        setAddresses(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/addresses', formData);
      if (res.data.success) {
        setShowModal(false);
        fetchAddresses();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save address');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this delivery address?')) return;
    try {
      await api.delete(`/addresses/${id}`);
      fetchAddresses();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between pb-6 border-b border-slate-200 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Delivery Destinations & Warehouses
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your shop locations, transport delivery points, and regional addresses.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-rose-500/20"
        >
          <Plus className="w-4 h-4" /> Add New Address
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-500 font-semibold">Loading addresses...</div>
      ) : addresses.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8">
          <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No Saved Delivery Addresses</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`bg-white rounded-3xl border p-6 shadow-sm relative flex flex-col justify-between ${
                addr.is_default ? 'border-rose-500 ring-2 ring-rose-500/10' : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="font-bold text-slate-900 text-sm">{addr.contact_person}</span>
                  {addr.is_default && (
                    <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Default
                    </span>
                  )}
                </div>

                <div className="mt-3 text-xs text-slate-600 space-y-1 leading-relaxed">
                  {addr.business_name && <p className="font-bold text-slate-800">{addr.business_name}</p>}
                  <p>{addr.address_line1}</p>
                  {addr.address_line2 && <p>{addr.address_line2}</p>}
                  {addr.landmark && <p className="text-slate-400">Landmark: {addr.landmark}</p>}
                  <p className="font-semibold text-slate-900">
                    {addr.city}, {addr.state} - {addr.pincode}
                  </p>
                  <p className="pt-2 text-slate-500">Phone: <strong>{addr.phone}</strong></p>
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => handleDelete(addr.id)}
                  className="text-xs text-slate-400 hover:text-rose-600 flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
              Add Delivery Address
            </h3>
            <form onSubmit={handleAddAddress} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Contact Person</label>
                <input
                  type="text"
                  required
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  placeholder="e.g. Rahul Deshmukh"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  pattern="[0-9]{10}"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="9820033333"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Address Line 1</label>
                <input
                  type="text"
                  required
                  value={formData.address_line1}
                  onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                  placeholder="Shop No. 14, Laxmi Road"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">PIN Code</label>
                  <input
                    type="text"
                    required
                    pattern="[0-9]{6}"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-500/20"
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Addresses;
