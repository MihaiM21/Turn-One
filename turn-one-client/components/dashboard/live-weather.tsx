'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { 
  Thermometer, 
  Droplets, 
  Wind, 
  Eye,
  CloudRain,
  Sun,
  Cloud,
  Gauge
} from 'lucide-react';

interface WeatherData {
  temperature: number;
  humidity: number;
  trackTemp: number;
  windSpeed: number;
  windDirection: number;
  windGust?: number;
  visibility: number;
  rainfall: boolean;
  rainIntensity?: number; // 0-100
  pressure: number;
  conditions: 'sunny' | 'cloudy' | 'overcast' | 'light-rain' | 'heavy-rain';
}

interface LiveWeatherProps {
  weather: WeatherData;
  className?: string;
}

export function LiveWeather({ weather, className }: LiveWeatherProps) {
  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'sunny':
        return <Sun className="w-8 h-8 text-yellow-500" />;
      case 'cloudy':
        return <Cloud className="w-8 h-8 text-gray-400" />;
      case 'overcast':
        return <Cloud className="w-8 h-8 text-gray-600" />;
      case 'light-rain':
      case 'heavy-rain':
        return <CloudRain className="w-8 h-8 text-blue-500" />;
      default:
        return <Sun className="w-8 h-8 text-yellow-500" />;
    }
  };

  const getWindDirection = (degrees: number) => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  };

  const getTemperatureColor = (temp: number) => {
    if (temp < 10) return 'text-blue-400';
    if (temp < 20) return 'text-cyan-400';
    if (temp < 30) return 'text-green-400';
    if (temp < 40) return 'text-yellow-400';
    if (temp < 50) return 'text-orange-400';
    return 'text-red-400';
  };

  const getTrackTempColor = (temp: number) => {
    if (temp < 20) return 'text-blue-400';
    if (temp < 30) return 'text-cyan-400';
    if (temp < 40) return 'text-green-400';
    if (temp < 50) return 'text-yellow-400';
    if (temp < 60) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <Card className={cn('card-hover', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Thermometer className="w-5 h-5 text-primary" />
            Weather Conditions
          </div>
          {getWeatherIcon(weather.conditions)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Temperature Display */}
        <div className="grid grid-cols-2 gap-6">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Thermometer className="w-4 h-4" />
              Air Temperature
            </div>
            <div className={cn('text-3xl font-bold', getTemperatureColor(weather.temperature))}>
              {weather.temperature}°C
            </div>
          </div>
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Gauge className="w-4 h-4" />
              Track Temperature
            </div>
            <div className={cn('text-3xl font-bold', getTrackTempColor(weather.trackTemp))}>
              {weather.trackTemp}°C
            </div>
          </div>
        </div>

        {/* Weather Details Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Humidity */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Droplets className="w-4 h-4" />
                Humidity
              </div>
              <span className="font-medium">{weather.humidity}%</span>
            </div>
            <Progress value={weather.humidity} className="h-2" />
          </div>

          {/* Visibility */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Eye className="w-4 h-4" />
                Visibility
              </div>
              <span className="font-medium">{weather.visibility} km</span>
            </div>
            <Progress value={(weather.visibility / 10) * 100} className="h-2" />
          </div>

          {/* Wind Speed */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Wind className="w-4 h-4" />
                Wind Speed
              </div>
              <span className="font-medium">{weather.windSpeed} km/h</span>
            </div>
            <Progress value={(weather.windSpeed / 50) * 100} className="h-2" />
          </div>

          {/* Pressure */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Gauge className="w-4 h-4" />
                Pressure
              </div>
              <span className="font-medium">{weather.pressure} hPa</span>
            </div>
            <Progress value={((weather.pressure - 980) / 40) * 100} className="h-2" />
          </div>
        </div>

        {/* Wind Direction */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Wind className="w-4 h-4" />
            Wind Direction
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono">
              {getWindDirection(weather.windDirection)}
            </Badge>
            <span className="text-sm font-medium">{weather.windDirection}°</span>
            {weather.windGust && (
              <span className="text-xs text-muted-foreground">
                (Gusts: {weather.windGust} km/h)
              </span>
            )}
          </div>
        </div>

        {/* Rain Conditions */}
        {weather.rainfall && (
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-blue-400">
                <CloudRain className="w-4 h-4" />
                <span className="text-sm font-medium">Rain Detected</span>
              </div>
              <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
                Active
              </Badge>
            </div>
            {weather.rainIntensity && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Intensity</span>
                  <span className="text-blue-400">{weather.rainIntensity}%</span>
                </div>
                <Progress 
                  value={weather.rainIntensity} 
                  className="h-2" 
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}