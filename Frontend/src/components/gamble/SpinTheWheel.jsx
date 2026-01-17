import { useEffect, useState } from "react";
import useUser from "../../hooks/useUser";


export default function SpinTheWheel({ open = false, onClose = () => {}, expense = {} }) {
    const me = useUser();
    const totalCents = expense?.amount_cents || 0;
    const userShareCents = (expense?.expense_splits || []).filter(x => x.user_id === me?.user?.id)[0]?.share_cents || 0;

    // slider state (starts at userShare) and percentage state driven from slider
    const [sliderVal, setSliderVal] = useState(userShareCents);
    const [percentage, setPercentage] = useState(userShareCents / totalCents * 100 || 0);

  // clamp percentage for the pie rendering
  const p = Math.max(0, Math.min(100, percentage));
  const sizeDeg = p * 3.6; // numeric degrees
  const startDeg = -90; // numeric start in degrees (same as string "-90deg" previously)
  const start = `${startDeg}deg`;

  // spinning / rotation state
  const [rotationDeg, setRotationDeg] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null); // null | 'win' | 'lose'

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const onSliderChange = (e) => {
    const val = Number(e.target.value || 0);
    setSliderVal(val);
    if (totalCents > 0) {
      setPercentage((val / totalCents) * 100);
    } else {
      setPercentage(0);
    }
  };

  // helper: normalize angle to [0,360)
  const norm = (ang) => {
    let a = ang % 360;
    if (a < 0) a += 360;
    return a;
  };

  // check if angle `a` (0..360) is inside the sector starting at startDeg spanning sizeDeg degrees
  const isAngleInSector = (a, startDegLocal, sizeDegLocal) => {
    const s = norm(startDegLocal);
    const e = norm(s + sizeDegLocal);
    const angle = norm(a);
    if (sizeDegLocal <= 0) return false;
    if (s < e) {
      return angle >= s && angle <= e;
    } else {
      // wrapped around 360
      return angle >= s || angle <= e;
    }
  };

  // when wheel rotation transition ends, determine win/lose
  const onWheelTransitionEnd = () => {
    // alpha at pointer (wheel local coordinates) is the wheel angle that maps to the page top (-90deg)
    // solution: alpha_pointer = (-90 - rotationDeg) mod 360
    const alphaPointer = norm(-90 - rotationDeg);
    const win = isAngleInSector(alphaPointer, startDeg, sizeDeg);
    setResult(win ? "win" : "lose");
    setSpinning(false);
  };

  const handleSpin = () => {
    if (spinning) return;
    setResult(null);
    setSpinning(true);
    // random target in [0,360)
    const randomStop = Math.random() * 360;
    const rotations = 4 + Math.floor(Math.random() * 3); // 4..6 full rotations
    const target = rotations * 360 + randomStop;
    // set rotation to trigger CSS transition
    requestAnimationFrame(() => {
      setRotationDeg((prev) => prev + target); // accumulate so multiple spins keep increasing
    });
  };

    return (<div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
        onMouseDown={onClose} // click outside to close
        aria-modal="true"
        role="dialog"
    >
        <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-auto p-8"
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
            <h2 className="text-2xl font-bold mb-4 text-center">SPIN THE WHEEL.</h2>

            <div className="flex items-start justify-center gap-8">
              {/* wheel + pie */}
              <div className="wheel-wrap relative" style={{ width: 180, height: 180 }}>
                {/* indicator / spoke at top (replaced with a static pointer + needle) */}
                <div
                  className="absolute left-1/2 -translate-x-1/2 -top-6 z-30 pointer-events-none"
                  aria-hidden="true"
                >
                  {/* triangle pointer */}
                  <div
                    style={{
                      width: 0,
                      height: 0,
                      borderLeft: "10px solid transparent",
                      borderRight: "10px solid transparent",
                      borderBottom: "14px solid #111",
                    }}
                  />
                  {/* short needle into the wheel */}
                  <div
                    style={{
                      width: 2,
                      height: 12,
                      background: "#111",
                      margin: "0 auto",
                      marginTop: -2,
                      borderRadius: 1,
                    }}
                  />
                </div>

                <div
                  className="wheel origin-center"
                  onTransitionEnd={onWheelTransitionEnd}
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    transform: `rotate(${rotationDeg}deg)`,
                    transition: spinning ? "transform 3s cubic-bezier(.18,.9,.32,1)" : "none",
                    position: "relative",
                    overflow: "hidden",
                    background: "#eee",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div
                    className="pie absolute inset-0 pointer-events-none"
                    style={{
                      borderRadius: "50%",
                      background: `conic-gradient(from ${start}, transparent 0, #ff6b6b 0 ${sizeDeg}deg, transparent ${sizeDeg}deg)`,
                    }}
                  />
                  {/* center dot */}
                  <div className="w-6 h-6 rounded-full bg-white border border-gray-200 z-10" />
                </div>
              </div>

              {/* info + controls */}
              <div className="flex-1">
                <div className="mt-2">
                  <p className="text-sm text-gray-600">Total Share ${totalCents}</p>
                  <p className="text-sm text-gray-600">Your Share ${userShareCents}</p>
                </div>

                {/* Slider: 0 .. totalCents */}
                <div className="mt-6">
                  <label className="block text-sm text-gray-600 mb-2">Adjust share</label>
                  <input
                    type="range"
                    min={0}
                    max={totalCents}
                    step={1}
                    value={sliderVal}
                    onChange={onSliderChange}
                    className="w-full"
                    aria-label="Adjust share slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0</span>
                    <span>I WANT TO PAY {sliderVal} cents</span>
                    <span>{totalCents}</span>
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-3">
                  <button
                    onClick={handleSpin}
                    disabled={spinning}
                    className={`px-4 py-2 rounded-md text-white ${spinning ? "bg-gray-400" : "bg-indigo-600 hover:bg-indigo-700"}`}
                  >
                    {spinning ? "Spinning..." : "Spin"}
                  </button>

                  <button
                    onClick={() => { setRotationDeg(0); setResult(null); }}
                    className="px-3 py-2 border rounded-md text-sm"
                  >
                    Reset
                  </button>
                </div>

                <div className="mt-4 min-h-[1.5rem]">
                  {result === "win" && <div className="text-green-600 font-semibold">You win!</div>}
                  {result === "lose" && <div className="text-red-600 font-semibold">You lose.</div>}
                </div>
              </div>
            </div>

            <style>{`
        .wheel-wrap { }
      `}</style>



        </div>
    </div>)
}
