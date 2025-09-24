import F1LiveDataAcquisition from './liveAcquisition';
import * as fs from 'fs';
import * as path from 'path';

interface F1DataLogger {
  startLogging(): void;
  stopLogging(): void;
  saveToFile(filename?: string): void;
}

class F1DataExporter implements F1DataLogger {
  private f1Data: F1LiveDataAcquisition;
  private isLogging = false;
  private loggedData: any[] = [];
  private startTime: Date | null = null;

  constructor() {
    this.f1Data = new F1LiveDataAcquisition();
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.f1Data.onData((data) => {
      if (this.isLogging) {
        this.loggedData.push({
          timestamp: new Date().toISOString(),
          messageCount: this.f1Data.getMessageCount(),
          data: data
        });
      }
    });

    this.f1Data.onStatus((status) => {
      console.log(`F1 Data Status: ${status}`);
      
      if (status === 'connected' && !this.startTime) {
        this.startTime = new Date();
        console.log('✅ Connected to F1 live timing at', this.startTime.toISOString());
      }
    });
  }

  public async connect(): Promise<void> {
    await this.f1Data.connect();
  }

  public disconnect(): void {
    this.stopLogging();
    this.f1Data.disconnect();
  }

  public startLogging(): void {
    this.isLogging = true;
    this.loggedData = [];
    this.startTime = new Date();
    console.log('📊 Started logging F1 data at', this.startTime.toISOString());
  }

  public stopLogging(): void {
    this.isLogging = false;
    console.log('⏹️ Stopped logging F1 data');
  }

  public saveToFile(filename?: string): void {
    if (this.loggedData.length === 0) {
      console.log('❌ No data to save');
      return;
    }

    const defaultFilename = `f1-data-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const filepath = filename || defaultFilename;
    
    const exportData = {
      metadata: {
        startTime: this.startTime?.toISOString(),
        endTime: new Date().toISOString(),
        totalMessages: this.loggedData.length,
        duration: this.startTime ? Date.now() - this.startTime.getTime() : 0
      },
      data: this.loggedData
    };

    fs.writeFileSync(filepath, JSON.stringify(exportData, null, 2));
    console.log(`💾 Saved ${this.loggedData.length} messages to ${filepath}`);
  }

  public getStats(): { messageCount: number; isActive: boolean; loggedMessages: number } {
    return {
      messageCount: this.f1Data.getMessageCount(),
      isActive: this.f1Data.isActive(),
      loggedMessages: this.loggedData.length
    };
  }

  public getCurrentData() {
    return this.f1Data.getCurrentData();
  }
}

export default F1DataExporter;