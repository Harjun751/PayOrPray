const supabase = require('../database.js');
const { getSimplifiedDebt } = require("../algo/DebtSolver");

async function getDebt(req, res) {
    let people;
    {
        const {data, error} = await supabase.from('trip_members')
            .select(`*,
            users!inner (
              name
            )`)
            .eq("trip_id", req.params.tripId);
        if (error != null){
            return res.send(error);
        }
        people = data;
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
    people = people.map(x => x.users.name);
    let payments = simplifyTransfers(paymentMatrix);
    let instructions = getSimplifiedDebt(people, payments);
    return res.status(200).json(instructions)
}

function getPaymentMatrix(people, expenses) {
    let paymentGraph = [];
    for (let i = 0; i < expenses.length; i++) {
        let fromP = people.filter(x => x.user_id === expenses[i].user_id)[0];
        let toP = people.filter(x => x.user_id === expenses[i].expense.payer)[0];
        paymentGraph.push({ from: fromP.users.name, to: toP.users.name, amount: expenses[i].share_cents });
    }
    return paymentGraph;
}


/**
 * Simplify transfers by netting out opposite directions and aggregating duplicates.
 *
 * @param {Array<{from:string|number, to:string|number, amount:number}>} transfers
 * @returns {Array<{from:string|number, to:string|number, amount:number}>}
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
    const visitedPairs = new Set(); // track unordered pairs like "a|b" (lexicographic min|max) so we only process once
    const result = [];

    const getAmount = (a, b) => agg.get(`${a}|${b}`) || 0;

    for (const key of agg.keys()) {
        const [a, b] = key.split('|');
        if (a === b) continue; // self transfers ignored

        // Use lexicographic order to form an unordered pair key for strings/numeric ids
        const pairKey = a < b ? `${a}|${b}` : `${b}|${a}`;
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

    // Sort by from then to for stable, readable output (string-safe)
    result.sort((x, y) => {
        const fa = String(x.from);
        const fb = String(y.from);
        if (fa === fb) return String(x.to).localeCompare(String(y.to));
        return fa.localeCompare(fb);
    });

    return result;
}


module.exports = {getDebt};
