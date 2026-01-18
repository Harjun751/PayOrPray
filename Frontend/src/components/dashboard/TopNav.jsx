export default function TopNav({ userEmail, onAdd, onSignOut }) {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur">
      <div className="mx-auto w-full max-w-6xl px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold">
                $
              </div>
              <div className="text-lg font-bold">Pay or Pray</div>
            </div>
            <div className="mt-0.5 text-[11px] text-gray-600">
              Split expenses, settle with games
            </div>
          </div>

          <div className="flex items-center gap-3">
            {userEmail ? (
              <div className="hidden md:block rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-700">
                {userEmail}
              </div>
            ) : null}

            <button
              onClick={onSignOut}
              className="hidden sm:inline-flex rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold hover:bg-gray-50 transition"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
