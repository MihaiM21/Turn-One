'use client';

import React, { useState, useEffect } from 'react';
import { Users, RefreshCw } from 'lucide-react';
import { fetchOnlineUsers } from '@/lib/adminService';

export function OnlineUsersWidget() {
  const [onlineCount, setOnlineCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const result = await fetchOnlineUsers();
    if (result.success) {
      setOnlineCount(result.count);
    }
    setLoading(false);
  };

  // Initial fetch and set up polling
  useEffect(() => {
    fetchData();
    // Poll every 60 seconds for updates
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-green-500/10 border border-green-500/30">
      <div className="relative">
        <Users className="h-4 w-4 text-green-500" />
        <div className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse" />
      </div>
      <span className="text-sm font-semibold text-green-400">{loading ? '...' : onlineCount}</span>
      <button
        onClick={() => fetchData()}
        className="ml-1 hover:opacity-70 transition-opacity"
        title="Refresh"
      >
        <RefreshCw className={`h-3 w-3 text-green-400 ${loading ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );
}
