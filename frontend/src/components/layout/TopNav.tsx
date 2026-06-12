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
    <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-slate-200 fixed left-64 right-0 z-20 font-sans">
      <div className="flex items-center gap-3">
        {/* Navigation Indicator / Brand Icon */}
        <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
        </svg>
        <span className="text-sm font-black text-slate-800 tracking-tight select-none mr-6">Gov Monitor</span>
      </div>

      {/* Central Search Bar Trigger */}
      <button 
        onClick={() => {
          const event = new KeyboardEvent('keydown', {
            key: 'k',
            ctrlKey: true,
            bubbles: true,
            cancelable: true
          });
          window.dispatchEvent(event);
        }}
        className="w-96 flex items-center justify-between px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-450 hover:bg-slate-100 hover:border-slate-300 transition text-xs font-semibold cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.637 10.637Z" />
          </svg>
          <span>Search Everything...</span>
        </div>
        <kbd className="font-mono text-[9px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-400 select-none shadow-sm">Ctrl+K</kbd>
      </button>

      <div className="flex items-center gap-6">
        {/* Notification Bell (Only for logged-in users) */}
        {isLoggedIn && (
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="p-2 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 text-slate-600 transition relative focus:outline-none"
              title="Notifications"
            >
              {/* Premium Bell SVG */}
              <svg className="w-5 h-5 text-slate-650" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 bg-blue-600 text-white text-[8px] font-black rounded-full h-3.5 w-3.5 flex items-center justify-center ring-2 ring-white animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown Overlay */}
            {showDropdown && (
              <div className="absolute right-0 mt-2.5 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl py-2.5 z-50 text-slate-850 transform origin-top-right transition-all duration-150">
                <div className="px-4 py-2 border-b border-slate-100 font-extrabold text-xs text-slate-700 flex justify-between items-center uppercase tracking-wider">
                  <span>Notifications Panel</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{unreadCount} unread</span>
                  )}
                </div>
                
                <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 pr-0.5">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-xs text-slate-400 font-semibold">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`px-4 py-3.5 text-xs transition-colors hover:bg-slate-50 flex flex-col gap-2 ${
                          !notif.read ? 'bg-blue-50/30 font-bold text-slate-900 border-l-2 border-blue-600' : 'text-slate-650'
                        }`}
                      >
                        <div className="leading-snug">{notif.message}</div>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-[8px] text-slate-400 font-mono font-bold uppercase">
                            {new Date(notif.created_at).toLocaleString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {!notif.read && (
                            <button
                              onClick={() => handleMarkAsRead(notif.id)}
                              className="text-[9px] font-black text-blue-600 hover:text-blue-800 transition"
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
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-bold text-sm shadow-sm">
            {name.charAt(0).toUpperCase()}
          </div>
          <div className="text-xs">
            <div className="font-extrabold text-slate-900 leading-tight">{name}</div>
            <div className="text-[10px] text-slate-450 mt-0.5 font-bold uppercase tracking-wider">{role}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
