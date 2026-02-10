'use client';

import { useState, useEffect } from 'react';
import { getAuthToken } from '@/lib/auth-utils';

interface NotificationStats {
  totalNotifications: number;
  unreadCount: number;
  readCount: number;
}

export function useNotificationStats() {
  const [stats, setStats] = useState<NotificationStats>({
    totalNotifications: 0,
    unreadCount: 0,
    readCount: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/Notification/stats`,
        {
          headers: { Authorization: token },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to load notification stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return { stats, loading, refetch: fetchStats };
}
