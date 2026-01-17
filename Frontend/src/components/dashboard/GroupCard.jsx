function AvatarStack({ members }) {
  return (
    <div className="flex -space-x-2">
      {members.map((m) => (
        <div
          key={m}
          className="grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-gradient-to-br from-purple-500 to-pink-500 text-[10px] font-bold text-white"
          title={m}
        >
          {m}
        </div>
      ))}
    </div>
  );
}

export default function GroupCard({ group, onClick }) {
  const positive = group.balance > 0;

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl border border-gray-200 bg-white p-5 hover:border-gray-300 hover:shadow-md transition"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`grid h-12 w-12 place-items-center rounded-2xl ${group.accent}`}>
            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>

          <div className="min-w-0">
            <div className="truncate text-base font-semibold">{group.name}</div>
            <div className="mt-0.5 text-xs text-gray-600">{group.memberCount} members</div>
          </div>
        </div>

        <div
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
            positive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}
        >
          {positive ? "+" : ""}
          {group.balance.toFixed(2)}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <AvatarStack members={group.members} />
        <div className="text-xs text-gray-600">
          {positive ? (
            <span className="text-green-700">
              Owed: <span className="font-semibold">${Math.abs(group.balance).toFixed(2)}</span>
            </span>
          ) : (
            <span className="text-red-700">
              Owing: <span className="font-semibold">${Math.abs(group.balance).toFixed(2)}</span>
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
