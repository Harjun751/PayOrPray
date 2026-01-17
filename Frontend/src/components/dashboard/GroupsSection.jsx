import GroupCard from "./GroupCard";

export default function GroupsSection({ groups, onNewGroup, onOpenGroup }) {
  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Your groups</h2>
          <p className="mt-1 text-xs text-gray-600">
            Track balances and settle up (or spin it).
          </p>
        </div>

        <button
          onClick={onNewGroup}
          className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold hover:bg-gray-50 transition"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New group
        </button>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {groups.map((g) => (
          <GroupCard key={g.id} group={g} onClick={() => onOpenGroup(g)} />
        ))}
      </div>
    </section>
  );
}
