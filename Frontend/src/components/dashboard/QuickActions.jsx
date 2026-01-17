function ActionButton({ title, desc, onClick, variant = "primary" }) {
  const base =
    "w-full rounded-2xl px-4 py-3 text-left transition border";
  const styles =
    variant === "primary"
      ? "bg-gray-900 text-white border-gray-900 hover:opacity-95"
      : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50";

  return (
    <button onClick={onClick} className={`${base} ${styles}`}>
      <div className="text-sm font-semibold">{title}</div>
      <div className={`mt-1 text-xs ${variant === "primary" ? "text-white/80" : "text-gray-600"}`}>
        {desc}
      </div>
    </button>
  );
}

export default function QuickActions({ onAddExpense, onSettleUp, onPayOrPray }) {
  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-sm font-bold">Quick actions</h3>
      <p className="mt-1 text-xs text-gray-600">
        Do the normal thing… or the funny thing.
      </p>

      <div className="mt-4 space-y-3">
        <ActionButton
          title="Add expense"
          desc="Record a bill and split it instantly."
          onClick={onAddExpense}
          variant="primary"
        />
        <ActionButton
          title="Settle up"
          desc="Simplify debts and close balances."
          onClick={onSettleUp}
          variant="secondary"
        />
        <ActionButton
          title="Pay or Pray 🎲"
          desc="Create a consent-based gamble round."
          onClick={onPayOrPray}
          variant="secondary"
        />
      </div>

      <div className="mt-4 rounded-2xl bg-purple-50 border border-purple-100 p-4">
        <div className="text-xs font-semibold text-purple-900">House rule tip</div>
        <div className="mt-1 text-xs text-purple-800">
          Add a cap + cooldown so no one gets farmed by RNG.
        </div>
      </div>
    </section>
  );
}
