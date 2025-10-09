export interface Version {
  version: string;
  major: number;
  minor: number;
  patch: number;
  preRelease?: string;
  buildMetadata?: string;
  releasedAt: string;
  releaseNotes: string;
}

export class VersionService {
  private static baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5271/api';
  private static version = null as Version | null;

  /**
   * Get the current version of the application
   */
  public static async getCurrentVersion(): Promise<Version> {
    // Return cached version if available
    if (this.version) {
      return this.version;
    }

    try {
      // Get token from localStorage if available
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};
      const response = await fetch(`${this.baseUrl}/version/current`, {
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch version: ${response.statusText}`);
      }

      const versionData = await response.json();
      this.version = versionData;
      return versionData;
    } catch (error) {
      console.error('Error fetching current version:', error);
      
      // Default version as fallback when API is unreachable
      return {
        version: '1.0.0',
        major: 1,
        minor: 0,
        patch: 0,
        releasedAt: new Date().toISOString(),
        releaseNotes: 'API Unreachable - Using Default Version',
      };
    }
  }

  /**
   * Get the version history
   */
  public static async getVersionHistory(): Promise<Version[]> {
    try {
      // Get token from localStorage if available
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};
      const response = await fetch(`${this.baseUrl}/version/history`, {
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch version history: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching version history:', error);
      return [];
    }
  }
}

export default VersionService;