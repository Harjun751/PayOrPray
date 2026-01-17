function Pill({ label, value, icon }) {
  return (
    <div className="rounded-2xl bg-white/20 p-4 backdrop-blur-sm">
      <div className="flex items-center gap-2 text-white/90 text-xs">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-1 text-2xl font-bold text-white">{value}</div>
    </div>
  );
}

export default function BalanceCard({ summary }) {
  const total = summary.total;
  const owedToYou = summary.owedToYou;
  const youOwe = summary.youOwe;

  return (
    <section className="rounded-3xl bg-gradient-to-br from-purple-500 to-pink-500 p-6 shadow-2xl">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xs font-medium text-white/85">Your balance</div>
          <div className="mt-2 text-4xl font-bold text-white">
            ${total.toFixed(2)}
          </div>
          <div className="mt-2 text-xs text-white/80">
            {total < 0 ? "You’re net down right now." : "You’re net up right now."}
          </div>
        </div>

        <div className="grid w-full gap-3 md:max-w-xl md:grid-cols-2">
          <Pill
            label="Owed to you"
            value={`$${owedToYou.toFixed(2)}`}
            icon={
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            }
          />
          <Pill
            label="You owe"
            value={`$${youOwe.toFixed(2)}`}
            icon={
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
              </svg>
            }
          />
        </div>
      </div>
    </section>
  );
}
