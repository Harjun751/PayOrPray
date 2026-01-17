// javascript
import { useEffect, useState } from "react";
import SpinTheWheel from "./gamble/SpinTheWheel.jsx";

export default function GambleTime({ open = false, onClose = () => {}, title = "Gamble Time", expense = {} }) {
    const [spinOpen, setSpinOpen] = useState(false);
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onMouseDown={onClose} // click outside to close
            aria-modal="true"
            role="dialog"
            aria-label={title}
        >
            <div
                className="relative bg-white rounded-2xl shadow-2xl w-full h-full mx-auto p-8"
                onMouseDown={(e) => e.stopPropagation()} // prevent backdrop close when clicking inside
            >
                <button
                    onClick={onClose}
                    aria-label="Cancel"
                    className="absolute top-4 right-4 text-gray-600 hover:text-gray-800 bg-white rounded-full p-2 border border-gray-100 shadow-sm"
                >
                    <span className="sr-only">Cancel</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M10 8.586l4.95-4.95a1 1 0 111.414 1.414L11.414 10l4.95 4.95a1 1 0 01-1.414 1.414L10 11.414l-4.95 4.95A1 1 0 013.636 14.95L8.586 10 3.636 5.05A1 1 0 015.05 3.636L10 8.586z" clipRule="evenodd" />
                    </svg>
                </button>
                <h2 className="text-2xl font-bold mb-4 text-center">THE TIME HAS COME TO GAMBLE.</h2>

                {/* Responsive card layout:
                    - Small screens: single column (stacked rows)
                    - md+ screens: 3-column grid
                */}
                <div className="mt-6">
                  {/* grid-cols-1 stacks cards on small screens; md:grid-cols-3 shows 3 columns on md+ */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 pb-2">
                    {/* Card 1 */}
                    <div className="w-full bg-white/95 border border-gray-100 rounded-lg p-6 shadow-sm min-h-[180px] flex flex-col justify-center">
                      <h3 className="text-lg font-semibold text-gray-900">SPIN THE WHEEL</h3>
                      <p className="text-sm text-gray-600 mt-2">Make your teammates suffer.</p>
                      <div className="mt-4">
                        <button onClick={() => setSpinOpen(true)} className="px-3 py-2 bg-primary-500 text-white rounded-md text-sm">Choose</button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* minimal spin-the-wheel component mounted inside the same modal (no UI here) */}
                <SpinTheWheel
                  open={spinOpen}
                  onClose={() => setSpinOpen(false)}
                  expense={expense}
                />
            </div>
        </div>
    );
}
