import React, { useState, useEffect } from 'react';
import { Bell, Check, X } from 'lucide-react';
import api from '../api/client';

export const NotificationModal = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications?limit=20');
      if (res.data.success) {
        setNotifications(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 sm:p-6 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-rose-600" />
            <h3 className="font-bold text-slate-900">Notifications</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={markAllAsRead}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline"
            >
              Mark all read
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 overflow-y-auto divide-y divide-slate-100 flex-1">
          {loading ? (
            <p className="text-center py-8 text-sm text-slate-500">Loading notifications...</p>
          ) : notifications.length === 0 ? (
            <p className="text-center py-8 text-sm text-slate-500">No notifications yet.</p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`py-3 first:pt-0 last:pb-0 ${
                  !n.is_read ? 'bg-rose-50/40 -mx-4 px-4 rounded-xl' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-bold text-slate-900">{n.title}</h4>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">
                    {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;
