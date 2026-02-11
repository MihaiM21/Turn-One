'use client';

import { useState, useEffect, useCallback } from 'react';
import { getF1LiveDataService, type F1DataCallback, type F1StatusCallback } from '@/lib/f1LiveDataService';
import { F1DataMapper, type MappedF1Data } from '@/lib/f1DataMapper';

export function useF1LiveData() {
    const [data, setData] = useState<MappedF1Data | null>(null);
    const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error' | 'no-session'>('disconnected');
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

    const f1Service = getF1LiveDataService();

    const handleData: F1DataCallback = useCallback((rawData) => {
        try {
            const mapped = F1DataMapper.mapF1Data(rawData);
            setData(mapped);
            setLastUpdate(new Date());
        } catch (err) {
            console.error("Failed to map F1 Data:", err);
        }
    }, []);

    const handleStatus: F1StatusCallback = useCallback((newStatus) => {
        setStatus(newStatus);
        if (newStatus === 'no-session') {
            // Keep data if we have it, even if session ends, or clear it if you prefer
            // setData(null); 
        }
    }, []);

    useEffect(() => {
        f1Service.onData(handleData);
        f1Service.onStatus(handleStatus);

        // Auto-connect
        f1Service.connect();

        return () => {
            f1Service.removeDataCallback(handleData);
            f1Service.removeStatusCallback(handleStatus);
            f1Service.disconnect();
        };
    }, [handleData, handleStatus]); // Removed f1Service from dependency (it's a singleton-getter)

    const connect = () => f1Service.connect();
    const disconnect = () => f1Service.disconnect();

    return {
        data,
        status,
        lastUpdate,
        connect,
        disconnect
    };
}
