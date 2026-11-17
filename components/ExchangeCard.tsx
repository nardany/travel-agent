interface ExchangeOutput {
  from?: string;
  to?: string;
  amount?: number;
  rate?: number;
  converted?: number;
  updatedAt?: string;
  error?: string;
}

interface ExchangeCardProps {
  state: string;
  input?: { from?: string; to?: string; amount?: number };
  output?: unknown;
}

export default function ExchangeCard({ state, input, output }: ExchangeCardProps) {

  if (state === "input-streaming" || state === "input-available") {
    return (
      <div className="text-sm text-gray-400 animate-pulse">
        Ստուգում եմ արժեքը {input?.from ?? ""} → {input?.to ?? ""} ...
      </div>
    );
  }

  if (state === "output-error") {
    return <div className="text-sm text-red-400">Չհաջողվեց ստանալ արժեքը</div>;
  }

  const data = output as ExchangeOutput;
  if(!data) return null;
  if(data?.error){
    return <div className="text-sm text-gray-400">{data.error}</div>
  }

  return(
    <div className="my-2 rounded-lg border border-gray-600 p-3 text-sm">
    <div className="flex items-center justify-between">
      <span className="font-semibold">Փոխարժեք</span>
      <span className="text-xs text-gray-400">{data.updatedAt}</span>
    </div>

    <div className="my-2 text-2xl font-bold">
      {data.amount} {data.from} = {data.converted?.toLocaleString()} {data.to}
    </div>

    <div className="text-gray-400">
      1 {data.from} = {data.rate?.toFixed(2)} {data.to}
    </div>
  </div>
  )
}