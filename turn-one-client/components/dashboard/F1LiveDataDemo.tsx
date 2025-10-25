'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useF1LiveData } from '@/hooks/use-f1-live-data';

export function F1LiveDataDemo() {
  const [backendStatus, setBackendStatus] = useState<any>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  
  const {
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
  } = useF1LiveData({
    autoConnect: true,
    subscribedFeeds: ['CarData', 'Position', 'TimingData', 'SessionInfo']
  });

  const handleGetBackendStatus = async () => {
    setStatusLoading(true);
    try {
      const status = await getF1ServiceStatus();
      setBackendStatus(status);
    } catch (error) {
      console.error('Failed to get backend status:', error);
      setBackendStatus({ error: 'Failed to get status' });
    } finally {
      setStatusLoading(false);
    }
  };

  const handleRestartBackend = async () => {
    try {
      await restartF1Service();
      // Refresh status after restart
      setTimeout(() => handleGetBackendStatus(), 2000);
    } catch (error) {
      console.error('Failed to restart backend service:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500';
      case 'disconnected':
        return 'bg-gray-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">F1 Live Data - SignalR Demo</h1>
        <Badge className={getStatusColor(status)}>
          {status.toUpperCase()}
        </Badge>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle>Connection Status</CardTitle>
          <CardDescription>Real-time connection status and controls</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Frontend Connection</p>
              <Badge variant={isConnected ? 'default' : 'secondary'}>
                {connectionState}
              </Badge>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge className={getStatusColor(status)}>
                {status}
              </Badge>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Is Connected</p>
              <Badge variant={isConnected ? 'default' : 'destructive'}>
                {isConnected ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Backend Status</p>
              <Badge variant={backendStatus?.IsConnected ? 'default' : 'destructive'}>
                {backendStatus?.Status || 'Unknown'}
              </Badge>
            </div>
          </div>

          <Separator />

          <div className="flex flex-wrap gap-2">
            <Button onClick={connect} disabled={isConnected}>
              Connect
            </Button>
            <Button onClick={disconnect} disabled={!isConnected} variant="outline">
              Disconnect
            </Button>
            <Button onClick={handleGetBackendStatus} disabled={statusLoading}>
              {statusLoading ? 'Loading...' : 'Get Backend Status'}
            </Button>
            <Button onClick={handleRestartBackend} variant="destructive">
              Restart Backend Service
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Feed Subscription */}
      <Card>
        <CardHeader>
          <CardTitle>Feed Subscription</CardTitle>
          <CardDescription>Subscribe/unsubscribe to specific F1 data feeds</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {['CarData', 'Position', 'TimingData', 'SessionInfo', 'WeatherData', 'TrackStatus'].map((feed) => (
              <div key={feed} className="flex gap-1">
                <Button 
                  size="sm" 
                  onClick={() => subscribeToFeed(feed)}
                  disabled={!isConnected}
                >
                  Subscribe {feed}
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => unsubscribeFromFeed(feed)}
                  disabled={!isConnected}
                >
                  Unsub
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Latest F1 Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Latest F1 Data</CardTitle>
            <CardDescription>Structured data from F1 feeds</CardDescription>
          </CardHeader>
          <CardContent>
            {data ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-semibold">Feed:</span>
                  <Badge>{data.FeedName}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Timestamp:</span>
                  <span className="text-sm">{data.Timestamp}</span>
                </div>
                <Separator />
                <div>
                  <p className="font-semibold mb-2">Data:</p>
                  <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-60">
                    {JSON.stringify(data.Data, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No data received yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Latest Raw Data</CardTitle>
            <CardDescription>Raw messages from the backend</CardDescription>
          </CardHeader>
          <CardContent>
            {rawData ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-semibold">Type:</span>
                  <Badge>{rawData.Type}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Timestamp:</span>
                  <span className="text-sm">{rawData.Timestamp}</span>
                </div>
                <Separator />
                <div>
                  <p className="font-semibold mb-2">Raw Data:</p>
                  <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-60">
                    {typeof rawData.Data === 'string' ? rawData.Data : JSON.stringify(rawData.Data, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No raw data received yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Backend Status Details */}
      {backendStatus && (
        <Card>
          <CardHeader>
            <CardTitle>Backend Service Details</CardTitle>
            <CardDescription>Status of the F1 backend service</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-3 rounded-md overflow-auto">
              {JSON.stringify(backendStatus, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}