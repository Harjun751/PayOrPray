import {useState} from "react";
import useUser from "../../hooks/useUser";
import { Wheel } from 'react-custom-roulette'
import {expensesApi} from "../../services/api.js";

const data = [
  { option: '0%', value: 0.0 },
  { option: '10%', value: 0.1 },
  { option: '20%', value: 0.2 },
  { option: '30%', value: 0.3 },
    { option: '50%', value: 0.5 },
  { option: '40%', value: 0.4 },
  { option: '50%', value: 0.5 },
  { option: '60%', value: 0.6 },
  { option: '70%', value: 0.7 },
    { option: '40%', value: 0.4 },
  { option: '80%', value: 0.8 },
  { option: '90%', value: 0.9 },
    { option: '10%', value: 0.1 },
  { option: '100%', value: 1.0 },
    { option: '30%', value: 0.3 },
];

export default function SpinTheWheel({
                                         open = false, onClose = () => {
    }, expense = {}
                                     }) {
    const me = useUser();
    const totalCents = expense?.amount_cents || 0;
    const userShareCents = (expense?.expense_splits || []).filter(x => x.user_id === me?.user?.id)[0]?.share_cents || 0;
    const [sliderVal, setSliderVal] = useState(userShareCents);
    const [spin, setSpin] = useState(false);
    const [prizeNumber, setPrizeNumber] = useState(0);

    // slider handler
    const onSliderChange = (e) => {
        const val = Number(e.target.value || 0);
        setSliderVal(val);
    };

    const handleWheelClick = () => {
        const idx = Math.floor(Math.random() * data.length);
        setPrizeNumber(idx);
        setSpin(true);
    };

    const handleVictory = async () => {
        alert("ahh.. the smell of victory!");
        // compute fraction from selected wheel item
        const item = data[prizeNumber] || { value: 0 };
        const frac = Number(item.value) || 0;

        // compute current user's share in cents
        const myShare = Math.round(frac * totalCents);

        // prepare splits and distribute the remainder among other members
        const splits = Array.isArray(expense?.expense_splits) ? expense.expense_splits : [];
        const meId = me?.user?.id;
        const otherSplits = splits.filter(s => s.user_id !== meId);
        const otherCount = otherSplits.length;

        let remaining = totalCents - myShare;
        let eachOther = otherCount > 0 ? Math.floor(remaining / otherCount) : 0;
        let remainder = otherCount > 0 ? remaining - eachOther * otherCount : 0;

        // build updated splits, giving one extra cent to the first `remainder` others
        const updatedSplits = splits.map(s => {
            if (s.user_id === meId) {
                return { ...s, share_cents: myShare };
            }
            const extra = remainder > 0 ? 1 : 0;
            if (remainder > 0) remainder--;
            return { ...s, share_cents: eachOther + extra };
        });

        const updatedExpense = { ...expense, expense_splits: updatedSplits };

        // confetti boom (dynamic import, safe if package missing)
        try {
          const mod = await import('canvas-confetti');
          const confetti = mod.default || mod;
          confetti({ particleCount: 120, spread: 160, origin: { y: 0.6 }, colors: ['#7c3aed', '#06b6d4', '#10b981', '#ef4444'] });
          confetti({ particleCount: 60, spread: 120, origin: { y: 0.5 }, colors: ['#7c3aed', '#06b6d4'] });
        } catch (e) {
          // confetti not available — ignore
          console.warn("confetti not available", e);
        }

        // call API to update splits and handle result
        try {
          if (expense?.trip_id && expense?.id) {
            await expensesApi.updateSplits(expense.trip_id, expense.id, updatedExpense);
            alert("Expense splits updated");

                       // notify the app that this expense was updated so other components can refresh their views
           try {
             window.dispatchEvent(new CustomEvent('expenseUpdated', { detail: updatedExpense }));
           } catch (e) {
             // ignore if environment doesn't support CustomEvent
             console.warn("failed to dispatch expenseUpdated", e);
           }

          } else {
            console.warn("Missing tripId or expenseId, cannot update splits");
          }
        } catch (err) {
          console.error("Failed to update expense splits:", err);
          alert("Failed to update splits");
        } finally {
          setSpin(false);
        }
    }

    if (!open) return null;

    return (<div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
        onClick={onClose} // click outside to close (use onClick for reliable ordering)
        aria-modal="true"
        role="dialog"
    >
        <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-auto p-8"
            onMouseDown={(e) => e.stopPropagation()} // prevent backdrop close when clicking inside
            onClick={(e) => e.stopPropagation()} // also prevent click from bubbling to backdrop
        >
            <button
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => onClose && onClose()}
                aria-label="Cancel"
                className="absolute top-4 right-4 text-gray-600 hover:text-gray-800 bg-white rounded-full p-2 border border-gray-100 shadow-sm"
            >
                <span className="sr-only">Cancel</span>
                {/* ...existing SVG... */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"
                     aria-hidden="true">
                    <path fillRule="evenodd"
                          d="M10 8.586l4.95-4.95a1 1 0 111.414 1.414L11.414 10l4.95 4.95a1 1 0 01-1.414 1.414L10 11.414l-4.95 4.95A1 1 0 013.636 14.95L8.586 10 3.636 5.05A1 1 0 015.05 3.636L10 8.586z"
                          clipRule="evenodd"/>
                </svg>
            </button>

            <h2 className="text-2xl font-bold mb-4 text-center">SPIN THE WHEEL.</h2>

            <div onClick={handleWheelClick}>
                <Wheel
                    mustStartSpinning={spin}
                    prizeNumber={prizeNumber}
                    data={data}
                    backgroundColors={['#3e3e3e', '#df3428']}
                    textColors={['#ffffff']}
                    onStopSpinning={handleVictory}
                />
            </div>



        </div>
    </div>)
}
