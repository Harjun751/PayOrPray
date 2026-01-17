export default function ActivityFeed({ items }) {
  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-sm font-bold">Recent activity</h3>
      <p className="mt-1 text-xs text-gray-600">What’s been happening in your groups.</p>

      <div className="mt-4 space-y-3">
        {items.map((a) => (
          <div key={a.id} className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="text-sm font-medium">{a.text}</div>
            <div className="mt-1 text-xs text-gray-500">{a.time} ago</div>
          </div>
        ))}
      </div>
    </section>
  );
}
