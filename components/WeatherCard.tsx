import { Sun, CloudSun, Cloud, CloudFog, CloudRain, CloudSnow, CloudLightning } from "lucide-react";

interface WeatherOutput {
  city?: string;
  date?: string;
  maxTemperature?: number;
  minTemperature?: number;
  precipitationProbability?: number;
  condition?: string;
  error?: string;
}

interface WeatherCardProps {
  state: string;
  input?: { city?: string; date?: string };
  output?: unknown;
}

function getWeatherIcon(condition?: string) {
  const c = condition ?? "";
  if (c.includes("thunder")) return CloudLightning;
  if (c.includes("snow")) return CloudSnow;
  if (c.includes("rain") || c.includes("drizzle") || c.includes("shower")) return CloudRain;
  if (c.includes("fog")) return CloudFog;
  if (c.includes("overcast")) return Cloud;
  if (c.includes("partly") || c.includes("mainly")) return CloudSun;
  if (c.includes("clear")) return Sun;
  return Cloud;
}

export default function WeatherCard({ state, input, output }: WeatherCardProps) {
  if (state === "input-streaming" || state === "input-available") {
    return (
      <div className="text-sm text-gray-400 animate-pulse">
        Ստուգում եմ եղանակը {input?.city ?? ""}...
      </div>
    );
  }

  if (state === "output-error") {
    return <div className="text-sm text-red-400">Չհաջողվեց ստանալ եղանակը</div>;
  }

  const data = output as WeatherOutput;

  if (data?.error) {
    return <div className="text-sm text-gray-400">{data.error}</div>;
  }
  const Icon = getWeatherIcon(data.condition);
  return (
    <div>
      <div className="my-2 rounded-lg border border-gray-600 p-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="font-semibold">{data.city}</span>
          <span className="text-xs text-[#0b0d12]">{data.date}</span>
        </div>

        <div className="my-2 text-2xl font-bold">
          {Math.round(data.maxTemperature ?? 0)}° / {Math.round(data.minTemperature ?? 0)}°
        </div>

        <div className="flex justify-between text-[#0b0d12]">
          <span title={data.condition}>
            <Icon className="h-6 w-6" aria-label={data.condition} />
          </span>
          <span>Անձրև. {data.precipitationProbability}%</span>
        </div>
      </div>
    </div>
  );
}