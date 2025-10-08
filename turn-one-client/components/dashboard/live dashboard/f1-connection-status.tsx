"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Activity, Clock, Database, Wifi, WifiOff } from "lucide-react"
import { useState, useEffect } from "react"
import { F1LiveData } from "@/lib/f1LiveDataService"
import { getF1WebSocketClient } from "@/lib/f1WebSocketClient"

export function F1ConnectionStatus() {
  const [status, setStatus] = useState<'connected' | 'connecting' | 'disconnected' | 'error' | 'no-session' | 'max-retries'>('disconnected');
  const [data, setData] = useState<F1LiveData>({});
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [hasLiveConnection, setHasLiveConnection] = useState(false);

  const f1Client = getF1WebSocketClient();

  useEffect(() => {
    const statusCallback = (newStatus: typeof status) => {
      setStatus(newStatus);
      setHasLiveConnection(f1Client.hasLiveConnection());
    };

    const dataCallback = (newData: F1LiveData) => {
      setData(newData);
      setHasLiveConnection(f1Client.hasLiveConnection());
      setLastUpdate(new Date().toLocaleString());
    };

    f1Client.onStatus(statusCallback);
    f1Client.onData(dataCallback);

    // Load initial data
    const currentData = f1Client.getCurrentData();
    if (Object.keys(currentData).length > 0) {
      setData(currentData);
      const timestamp = f1Client.getLastDataTimestamp();
      if (timestamp) {
        setLastUpdate(new Date(timestamp).toLocaleString());
      }
    }

    // Update connection status
    setHasLiveConnection(f1Client.hasLiveConnection());

    return () => {
      f1Client.removeStatusCallback(statusCallback);
      f1Client.removeDataCallback(dataCallback);
    };
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case 'connected': return hasLiveConnection ? 'bg-green-500' : 'bg-yellow-500';
      case 'connecting': return 'bg-blue-500';
      case 'disconnected': return 'bg-orange-500';
      case 'error': return 'bg-red-500';
      case 'no-session': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    if (status === 'connected' && hasLiveConnection) return 'Live';
    if (status === 'connected' && !hasLiveConnection) return 'Cached Data';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const connect = async () => {
    await f1Client.connect();
  };

  const disconnect = () => {
    f1Client.disconnect();
  };

  const clearCache = () => {
    f1Client.clearPersistedData();
    setData({});
    setLastUpdate(null);
  };

  return (
    <Card className="border-red-800/20 bg-black/40 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            {hasLiveConnection ? <Wifi className="h-5 w-5 text-green-400" /> : <WifiOff className="h-5 w-5 text-orange-400" />}
            F1 Live Data Status
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${getStatusColor()}`}></div>
            <Badge variant={hasLiveConnection ? "default" : "secondary"}>
              {getStatusText()}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-red-400" />
            <div>
              <div className="text-white font-medium">{Object.keys(data).length}</div>
              <div className="text-red-200">Data Fields</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-red-400" />
            <div>
              <div className="text-white font-medium">{lastUpdate || 'None'}</div>
              <div className="text-red-200">Last Update</div>
            </div>
          </div>
          {/* <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-red-400" />
            <div>
              <div className="text-white font-medium">{Object.keys(data).length}</div>
              <div className="text-red-200">Data Fields</div>
            </div>
          </div> */}
          <div className="flex items-center gap-2">
            <Wifi className="h-4 w-4 text-red-400" />
            <div>
              <div className="text-white font-medium">{hasLiveConnection ? 'Live' : 'Cached'}</div>
              <div className="text-red-200">Connection</div>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={connect}
            size="sm"
            className="bg-red-600 hover:bg-red-700"
            disabled={status === 'connecting'}
          >
            {status === 'connecting' ? 'Connecting...' : 'Connect'}
          </Button>
          <Button 
            onClick={disconnect}
            size="sm"
            variant="outline"
            className="border-red-600 text-red-400 hover:bg-red-600/10"
            disabled={status === 'disconnected' || status === 'no-session'}
          >
            Disconnect
          </Button>
          <Button 
            onClick={clearCache}
            size="sm"
            variant="outline"
            className="border-orange-600 text-orange-400 hover:bg-orange-600/10"
          >
            Clear Cache
          </Button>
        </div>

        {/* {Object.keys(data).length > 0 && (
          <div className="mt-4 p-3 bg-red-950/20 rounded border border-red-800/30">
            <div className="text-sm font-medium text-red-200 mb-2">Available Data Types:</div>
            <div className="flex flex-wrap gap-1">
              {Object.keys(data).map(key => (
                <Badge key={key} variant="outline" className="text-xs border-red-600 text-red-300">
                  {key}
                </Badge>
              ))}
            </div>
          </div>
        )} */}
      </CardContent>
    </Card>
  );
}