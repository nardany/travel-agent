import { fetchJson } from "./fetchJson";

interface ExchangeResponse {
  result: "success" | "error";
  rates?: Record<string, number>;
  time_last_update_utc?: string;
}

type ExchangeResult =
  | { error: string }
  | {
    from: string;
    to: string;
    amount: number;
    rate: number;
    converted: number;
    updatedAt: string;
  };

export async function getExchangeRate(
  from: string,
  to: string,
  amount: number
): Promise<ExchangeResult> {
  const currency = await fetchJson<ExchangeResponse>(
    `https://open.er-api.com/v6/latest/${encodeURIComponent(from)}`
  )
  if(currency.error){
    return { error : "Exchange rate service is unavailable" };
  }
  if(currency.data.result === "error" || !currency.data.rates){
    return { error : `Currency "${from}" is not supported`}
  }

  const rate = currency.data.rates[to];

  if(rate === undefined){
    return { error : `Currency "${to}" is not supported`}
  }

  const converted = Math.round((amount * rate) * 100) / 100;

  return {
    from,
    to,
    amount,
    rate,
    converted,
    updatedAt: currency.data.time_last_update_utc || new Date().toISOString(),
  }
}