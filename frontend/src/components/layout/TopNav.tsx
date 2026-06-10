import React, { useEffect, useState } from 'react';
import { notificationApi } from '../../services/api';

interface NotificationItem {
  id: string;
  user_id: string;
  message: string;
  read: boolean;
  created_at: string;
}

export default function TopNav() {
  const [name, setName] = useState('User');
  const [role, setRole] = useState('Guest');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setName(localStorage.getItem('user_name') || 'User');
    setRole(localStorage.getItem('user_role') || 'Guest');
    const token = localStorage.getItem('access_token');
    setIsLoggedIn(!!token);

    if (token) {
      fetchNotifications();
      
      // Establish real-time WebSocket connection
      const email = localStorage.getItem('user_email') || 'anonymous';
      const ws = new WebSocket(`ws://localhost:8006/ws/${encodeURIComponent(email)}`);
      
      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'notification') {
            setNotifications(prev => [
              {
                id: payload.id,
                user_id: payload.user_id,
                message: payload.message,
                read: payload.read,
                created_at: payload.created_at
              },
              ...prev
            ]);
          }
        } catch (err) {
          console.error("Failed to parse websocket message", err);
        }
      };
      
      return () => {
        ws.close();
      };
    }
  }, []);

  async function fetchNotifications() {
    try {
      const res = await notificationApi.get('/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.warn('Notification service is unavailable or returned error:', err);
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  async function handleMarkAsRead(notifId: string) {
    try {
      await notificationApi.put(`/notifications/${notifId}/read`);
      setNotifications(prev =>
        prev.map(n => (n.id === notifId ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-slate-200 fixed left-64 right-0 z-20">
      <div className="flex items-center gap-4">
        <h2 className="text-md font-semibold text-slate-800">Gov Monitor Dashboard</h2>
      </div>

      <div className="flex items-center gap-6">
        {/* Notification Bell (Only for logged-in users) */}
        {isLoggedIn && (
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-600 transition relative focus:outline-none"
              title="Notifications"
            >
              <span className="text-xl">🔔</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full h-4 w-4 flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown Overlay */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-lg shadow-lg py-2 z-50 text-slate-800">
                <div className="px-4 py-2 border-b border-slate-100 font-bold text-sm text-slate-700 flex justify-between items-center">
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-xs font-semibold text-blue-600">{unreadCount} new</span>
                  )}
                </div>
                
                <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-xs text-slate-400">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`px-4 py-3 text-xs transition-colors hover:bg-slate-50 flex flex-col gap-1.5 ${
                          !notif.read ? 'bg-blue-50/40 font-semibold' : ''
                        }`}
                      >
                        <div className="text-slate-700 leading-snug">{notif.message}</div>
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] text-slate-400 font-mono">
                            {new Date(notif.created_at).toLocaleTimeString()}
                          </span>
                          {!notif.read && (
                            <button
                              onClick={() => handleMarkAsRead(notif.id)}
                              className="text-[10px] font-bold text-blue-600 hover:text-blue-800"
                            >
                              Mark read
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* User Account Info */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
            {name.charAt(0).toUpperCase()}
          </div>
          <div className="text-sm">
            <div className="font-semibold text-slate-800 leading-tight">{name}</div>
            <div className="text-xs text-slate-500">{role}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
