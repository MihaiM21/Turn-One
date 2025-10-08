'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { F1LiveData, F1SignalRLiveDataService, getF1SignalRLiveDataService } from '../lib/f1SignalRLiveDataService';

interface UseF1SignalRLiveDataOptions {
  autoConnect?: boolean;
}

interface UseF1SignalRLiveDataResult {
  data: F1LiveData;
  isConnected: boolean;
  isConnecting: boolean;
  hasSession: boolean;
  status: 'connected' | 'connecting' | 'disconnected' | 'error' | 'no-session';
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  lastUpdated: string | null;
}

/**
 * Hook to use F1 live data from the backend SignalR connection
 * 
 * @param options Configuration options
 * @returns F1 live data state and control functions
 */
export function useF1SignalRLiveData(
  options: UseF1SignalRLiveDataOptions = {}
): UseF1SignalRLiveDataResult {
  const { autoConnect = true } = options;
  
  const [data, setData] = useState<F1LiveData>({});
  const [status, setStatus] = useState<'connected' | 'connecting' | 'disconnected' | 'error' | 'no-session'>('disconnected');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  
  // Use ref to keep service instance across re-renders
  const serviceRef = useRef<F1SignalRLiveDataService | null>(null);
  
  // Initialize service
  useEffect(() => {
    serviceRef.current = getF1SignalRLiveDataService();
    setLastUpdated(serviceRef.current.getLastDataTimestamp());
    
    return () => {
      // Cleanup
      if (serviceRef.current) {
        serviceRef.current.disconnect();
      }
    };
  }, []);
  
  // Set up data callback
  useEffect(() => {
    if (!serviceRef.current) return;
    
    const handleData = (newData: F1LiveData) => {
      setData(newData);
      setLastUpdated(serviceRef.current?.getLastDataTimestamp() || null);
    };
    
    const handleStatus = (newStatus: 'connected' | 'connecting' | 'disconnected' | 'error' | 'no-session') => {
      setStatus(newStatus);
    };
    
    serviceRef.current.onData(handleData);
    serviceRef.current.onStatus(handleStatus);
    
    // Initial data
    setData(serviceRef.current.getCurrentData());
    
    return () => {
      if (serviceRef.current) {
        serviceRef.current.removeDataCallback(handleData);
        serviceRef.current.removeStatusCallback(handleStatus);
      }
    };
  }, []);
  
  // Auto-connect if enabled
  useEffect(() => {
    if (autoConnect && serviceRef.current) {
      serviceRef.current.connect();
    }
  }, [autoConnect]);
  
  // Connect/disconnect functions
  const connect = useCallback(async () => {
    if (serviceRef.current) {
      await serviceRef.current.connect();
    }
  }, []);
  
  const disconnect = useCallback(async () => {
    if (serviceRef.current) {
      await serviceRef.current.disconnect();
    }
  }, []);
  
  const isConnected = status === 'connected';
  const isConnecting = status === 'connecting';
  const hasSession = serviceRef.current?.hasSession() || false;
  
  return {
    data,
    isConnected,
    isConnecting,
    hasSession,
    status,
    connect,
    disconnect,
    lastUpdated
  };
}