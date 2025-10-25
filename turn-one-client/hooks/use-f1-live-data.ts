'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { F1SignalRService, F1LiveData, F1RawData } from '@/lib/f1SignalRService';

export interface UseF1LiveDataOptions {
  autoConnect?: boolean;
  subscribedFeeds?: string[];
}

export interface UseF1LiveDataReturn {
  data: F1LiveData | null;
  rawData: F1RawData | null;
  status: 'connected' | 'connecting' | 'disconnected' | 'error';
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  subscribeToFeed: (feedName: string) => Promise<void>;
  unsubscribeFromFeed: (feedName: string) => Promise<void>;
  getF1ServiceStatus: () => Promise<any>;
  restartF1Service: () => Promise<any>;
  connectionState: string;
  // New persistence-related methods
  currentData: Record<string, any>;
  lastReceivedData: Record<string, any>;
  hasSession: boolean;
  lastUpdated: string | null;
  clearPersistedData: () => void;
}

export function useF1LiveData(options: UseF1LiveDataOptions = {}): UseF1LiveDataReturn {
  const { autoConnect = true, subscribedFeeds = [] } = options;
  
  const [data, setData] = useState<F1LiveData | null>(null);
  const [rawData, setRawData] = useState<F1RawData | null>(null);
  const [status, setStatus] = useState<'connected' | 'connecting' | 'disconnected' | 'error'>('disconnected');
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState('Disconnected');
  
  const serviceRef = useRef<F1SignalRService | null>(null);



  // Initialize service
  useEffect(() => {
    if (!serviceRef.current) {
      serviceRef.current = new F1SignalRService();
      
      // Set up callbacks
      serviceRef.current.setOnDataReceived((receivedData: F1LiveData) => {
        //console.log('🎯 Hook: Data received in callback:', receivedData);
        //console.log('🎯 Hook: Setting data state...');
        setData(receivedData);
        //console.log('🎯 Hook: Data state set');
      });

      serviceRef.current.setOnRawDataReceived((receivedRawData: F1RawData) => {
        setRawData(receivedRawData);
      });

      serviceRef.current.setOnStatusChanged((newStatus) => {
        setStatus(newStatus);
        setIsConnected(newStatus === 'connected');
      });
    }

    return () => {
      if (serviceRef.current) {
        serviceRef.current.disconnect();
      }
    };
  }, []);

  // Auto connect if enabled
  useEffect(() => {
    if (autoConnect && serviceRef.current && !isConnected && status !== 'connecting') {
      serviceRef.current.connect().catch(console.error);
    }
  }, [autoConnect, isConnected, status]);

  // Subscribe to feeds after connection
  useEffect(() => {
    if (isConnected && serviceRef.current && subscribedFeeds.length > 0) {
      subscribedFeeds.forEach(async (feed) => {
        try {
          await serviceRef.current!.subscribeToFeed(feed);
        } catch (error) {
          console.error(`Failed to subscribe to feed ${feed}:`, error);
        }
      });
    }
  }, [isConnected, subscribedFeeds]);

  // Update connection state periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (serviceRef.current) {
        setConnectionState(serviceRef.current.getConnectionState());
        setIsConnected(serviceRef.current.isConnected());
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

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

  const subscribeToFeed = useCallback(async (feedName: string) => {
    if (serviceRef.current) {
      await serviceRef.current.subscribeToFeed(feedName);
    }
  }, []);

  const unsubscribeFromFeed = useCallback(async (feedName: string) => {
    if (serviceRef.current) {
      await serviceRef.current.unsubscribeFromFeed(feedName);
    }
  }, []);

  const getF1ServiceStatus = useCallback(async () => {
    if (serviceRef.current) {
      return await serviceRef.current.getF1ServiceStatus();
    }
    throw new Error('Service not initialized');
  }, []);

  const restartF1Service = useCallback(async () => {
    if (serviceRef.current) {
      return await serviceRef.current.restartF1Service();
    }
    throw new Error('Service not initialized');
  }, []);

  // Get persisted data states
  const currentData = serviceRef.current?.getCurrentData() || {};
  const lastReceivedData = serviceRef.current?.getLastReceivedData() || {};
  const hasSession = serviceRef.current?.hasSession() || false;
  const lastUpdated = serviceRef.current?.getLastDataTimestamp() || null;
  
  // Function to clear persisted data
  const clearPersistedData = useCallback(() => {
    if (serviceRef.current) {
      serviceRef.current.clearPersistedData();
    }
  }, []);

  return {
    data,
    rawData,
    status,
    isConnected,
    connect,
    disconnect,
    subscribeToFeed,
    unsubscribeFromFeed,
    getF1ServiceStatus,
    restartF1Service,
    connectionState,
    // New persistence-related properties
    currentData,
    lastReceivedData,
    hasSession,
    lastUpdated,
    clearPersistedData,
  };
}