const supabase = require('../database.js');
const { getSimplifiedDebt } = require("../algo/DebtSolver");

async function getDebt(req, res) {
    let people;
    {
        const {data, error} = await supabase.from('trip_members')
            .select()
            .eq("trip_id", req.params.tripId);
        if (error != null){
            return res.send(error);
        }
        people = data.map(x => x.user_id);
    }

    let expenses;
    {
        const {data, error} = await supabase.from("expense_splits")
            .select(` 
            *,
            expense!inner (
              trip_id,
              payer
            )
            `)
            .eq("expense.trip_id", req.params.tripId);
        if (error != null) {
            return res.send(error);
        }
        expenses = data;
    }


    let paymentMatrix = getPaymentMatrix(people, expenses)
    let payments = simplifyTransfers(paymentMatrix);
    let instructions = getSimplifiedDebt(people, payments);
    return res.status(200).json(instructions)
}

function getPaymentMatrix(people, expenses) {
    let paymentGraph = [];
    for (let i = 0; i < expenses.length; i++) {
        let debt_payer = people.indexOf(expenses[i].user_id)
        let debt_earner = people.indexOf(expenses[i].expense.payer);
        paymentGraph.push({ from: expenses[i].user_id, to: expenses[i].expense.payer, amount: expenses[i].share_cents });
    }
    return paymentGraph;
}


/**
 * Simplify transfers by netting out opposite directions and aggregating duplicates.
 *
 * @param {Array<{from:number, to:number, amount:number}>} transfers
 * @param {Object} [options]
 * @returns {Array<{from:number, to:number, amount:number}>}
 */
function simplifyTransfers(transfers) {
    // 1) Aggregate duplicates first: sum amounts for identical (from,to)
    const agg = new Map(); // key: "from|to" -> amount sum
    for (const { from, to, amount } of transfers) {
        if (!Number.isFinite(amount) || amount <= 0) continue; // ignore invalid or non-positive amounts
        const key = `${from}|${to}`;
        agg.set(key, (agg.get(key) || 0) + amount);
    }

    // 2) Net out opposite directions for each unordered pair
    // We'll iterate the aggregated keys, and for each pair (a,b), compute net = sum(a->b) - sum(b->a).
    const visitedPairs = new Set(); // track unordered pairs like "min|max" so we only process once
    const result = [];

    const getAmount = (a, b) => agg.get(`${a}|${b}`) || 0;

    for (const key of agg.keys()) {
        const [aStr, bStr] = key.split('|');
        const a = Number(aStr);
        const b = Number(bStr);
        if (a === b) continue; // self transfers already handled above

        const pairKey = `${Math.min(a, b)}|${Math.max(a, b)}`;
        if (visitedPairs.has(pairKey)) continue;
        visitedPairs.add(pairKey);

        const ab = getAmount(a, b);
        const ba = getAmount(b, a);
        const net = ab - ba;

        if (net > 0) {
            result.push({ from: a, to: b, amount: net });
        } else if (net < 0) {
            result.push({ from: b, to: a, amount: -net });
        }
        // if net === 0, nothing to push (they cancel out)
    }

    // 4) Sort (optional): by from, then to for stable, readable output
    result.sort((x, y) => (x.from - y.from) || (x.to - y.to));

    return result;
}


module.exports = {getDebt};
