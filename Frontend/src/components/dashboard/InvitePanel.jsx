import React, { useState } from "react";

export default function InvitePanel({ invites = [], onAccept, onDecline }) {
  if (!invites || invites.length === 0) return null;

  const [loadingIds, setLoadingIds] = useState([]);

  const getId = (inv) => inv?.id ?? inv?.invite_id ?? inv?.InviteID ?? inv?.InviteId;

  const runAction = async (inv, fn) => {
    const id = getId(inv);
    if (!fn) return;
    setLoadingIds((s) => [...s, id]);
    try {
      await fn(inv);
    } finally {
      setLoadingIds((s) => s.filter((x) => x !== id));
    }
  };

  return (
    <section className="mb-6">
      <div className="w-full bg-white/95 border border-gray-100 rounded-2xl p-4 shadow-sm">
        <div className="flex gap-4 overflow-x-auto">
          {invites.map((inv) => {
            const id = getId(inv);
            const tripName = inv.trip_name || inv.tripName || inv.Description || "Unnamed trip";
            const isLoading = loadingIds.includes(id);

            return (
              <div
                key={id ?? tripName}
                className="flex-none w-full flex items-center justify-between gap-4 px-4 py-3 bg-white rounded-lg border border-gray-100"
              >
                <div className="flex-1">
                  <div className="text-sm text-gray-500">You have a pending invite to the group:</div>
                  <div className="text-lg font-semibold text-gray-900 truncate">{tripName}</div>
                </div>

                <div className="flex items-end gap-2">
                  <button
                    onClick={() => runAction(inv, onAccept)}
                    disabled={isLoading}
                    className="px-3 py-1.5 bg-green-500 text-white text-sm rounded-md hover:opacity-90 disabled:opacity-60 disabled:cursor-wait"
                  >
                    {isLoading ? "..." : "Accept"}
                  </button>
                  <button
                    onClick={() => runAction(inv, onDecline)}
                    disabled={isLoading}
                    className="px-3 py-1.5 bg-red-100 text-red-600 text-sm rounded-md hover:bg-red-200 disabled:opacity-60 disabled:cursor-wait"
                  >
                    Decline
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
