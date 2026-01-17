// Backend/controller/expenseSplitsController.js
const supabase = require("../database.js");
const getUserId = require("../utils/getAuth.js");

function toCents(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

function centsToAmount(cents) {
  return Number((Number(cents) / 100).toFixed(2));
}

async function assertTripMember(userId, tripId) {
  const { data, error } = await supabase
    .from("trip_members")
    .select("trip_id")
    .eq("trip_id", tripId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) return { ok: false, error };
  return { ok: !!data };
}

async function getExpenseAndCheckTrip(expenseId, tripId) {
  const { data, error } = await supabase
    .from("expense")
    .select("id, trip_id, amount_cents, payer")
    .eq("id", expenseId)
    .maybeSingle();

  if (error) return { ok: false, error };
  if (!data) return { ok: false, notFound: true };
  if (String(data.trip_id) !== String(tripId)) return { ok: false, wrongTrip: true };

  return { ok: true, expense: data };
}

async function assertAllAreTripMembers(tripId, userIds) {
  const ids = Array.from(new Set(userIds.map((x) => Number(x))));
  if (ids.length === 0) return { ok: false, message: "No user IDs provided" };

  const { data, error } = await supabase
    .from("trip_members")
    .select("user_id")
    .eq("trip_id", tripId)
    .in("user_id", userIds);
    
  if (error) return { ok: false, error };

  const memberSet = new Set((data || []).map((m) => Number(m.user_id)));
  for (const uid of ids) {
    if (!memberSet.has(Number(uid))) {
      return { ok: false, message: `User ${uid} is not a member of this trip` };
    }
  }
  return { ok: true };
}

function buildEqualSplitRows(amountCents, participantIds) {
  const ids = Array.from(new Set(participantIds.map((x) => Number(x))));
  const n = ids.length;

  const base = Math.floor(amountCents / n);
  let rem = amountCents % n;

  ids.sort((a, b) => a - b);

  return ids.map((uid) => {
    const share = base + (rem > 0 ? 1 : 0);
    if (rem > 0) rem -= 1;
    return { user_id: uid, share_cents: share };
  });
}

// function normalizeExplicitSplits(splits) {
//   // Accept {Splits:[{PersonID,Amount}]} OR [{PersonID,Amount}] OR {user_id, share_cents}
//   if (!Array.isArray(splits)) return null;

//   const rows = [];
//   let total = 0;

//   for (const s of splits) {
//     const personId = s.PersonID ?? s.user_id;
//     const amount = s.Amount ?? s.amount;

//     if (personId == null || amount == null) return null;

//     const cents = toCents(amount);
//     if (cents == null || cents < 0) return null;

//     rows.push({ user_id: Number(personId), share_cents: cents });
//     total += cents;
//   }

//   // merge duplicates (if any)
//   const merged = new Map();
//   for (const r of rows) {
//     merged.set(r.user_id, (merged.get(r.user_id) || 0) + r.share_cents);
//   }

//   const out = Array.from(merged.entries())
//     .map(([user_id, share_cents]) => ({ user_id, share_cents }))
//     .sort((a, b) => a.user_id - b.user_id);

//   const mergedTotal = out.reduce((acc, r) => acc + r.share_cents, 0);
//   return { rows: out, total: mergedTotal };
// }



async function getExpenseSplits(req, res) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ code: "UNAUTHORIZED", message: "Missing credentials" });

    const tripId = req.params.tripid;
    const expenseId = req.params.expenseid;

    const mem = await assertTripMember(userId, tripId);
    if (mem.error) return res.status(500).json({ code: "INTERNAL_ERROR", details: mem.error });
    if (!mem.ok) return res.status(403).json({ code: "FORBIDDEN", message: "Not a member of this trip" });

    const exp = await getExpenseAndCheckTrip(expenseId, tripId);
    if (exp.error) return res.status(500).json({ code: "INTERNAL_ERROR", details: exp.error });
    if (exp.notFound) return res.status(404).json({ code: "NOT_FOUND", message: "Expense not found" });
    if (exp.wrongTrip) return res.status(404).json({ code: "NOT_FOUND", message: "Expense not in this trip" });

    const { data, error } = await supabase
      .from("expense_splits")
      .select("expense_id, user_id, share_cents")
      .eq("expense_id", expenseId)
      .order("user_id", { ascending: true });

    if (error) return res.status(500).json({ code: "INTERNAL_ERROR", details: error });

    return res.status(200).json({
      Splits: (data || []).map((r) => ({
        PersonID: r.user_id,
        Amount: centsToAmount(r.share_cents),
      })),
    });
  } catch (e) {
    return res.status(500).json({ code: "INTERNAL_ERROR", message: String(e) });
  }
}

async function putExpenseSplits(req, res) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ code: "UNAUTHORIZED", message: "Missing credentials" });

    const tripId = req.params.tripid;
    const expenseId = req.params.expenseid;

    const mem = await assertTripMember(userId, tripId);
    if (mem.error) return res.status(500).json({ code: "INTERNAL_ERROR", details: mem.error });
    if (!mem.ok) return res.status(403).json({ code: "FORBIDDEN", message: "Not a member of this trip" });

    const exp = await getExpenseAndCheckTrip(expenseId, tripId);
    if (exp.error) return res.status(500).json({ code: "INTERNAL_ERROR", details: exp.error });
    if (exp.notFound) return res.status(404).json({ code: "NOT_FOUND", message: "Expense not found" });
    if (exp.wrongTrip) return res.status(404).json({ code: "NOT_FOUND", message: "Expense not in this trip" });

    const amountCents = Number(exp.expense.amount_cents);
    if (!Number.isFinite(amountCents) || amountCents < 0) {
      return res.status(500).json({ code: "INTERNAL_ERROR", message: "Expense amount_cents invalid" });
    }

    const participants = req.body?.Participants;
    if (!Array.isArray(participants) || participants.length === 0) {
      return res.status(400).json({
        code: "BAD_REQUEST",
        message: "Provide Participants (non-empty array) for equal split.",
      });
    }

    const memCheck = await assertAllAreTripMembers(tripId, participants);
    if (memCheck.error) return res.status(500).json({ code: "INTERNAL_ERROR", details: memCheck.error });
    if (!memCheck.ok) return res.status(400).json({ code: "BAD_REQUEST", message: memCheck.message });

    const splitRows = buildEqualSplitRows(amountCents, participants).map((r) => ({
      expense_id: Number(expenseId),
      user_id: r.user_id,
      share_cents: r.share_cents,
    }));

    const { error: delErr } = await supabase.from("expense_splits").delete().eq("expense_id", expenseId);
    if (delErr) return res.status(500).json({ code: "INTERNAL_ERROR", details: delErr });

    const { data: inserted, error: insErr } = await supabase.from("expense_splits").insert(splitRows).select();
    if (insErr) return res.status(500).json({ code: "INTERNAL_ERROR", details: insErr });

    return res.status(200).json({
      Splits: (inserted || []).map((r) => ({ PersonID: r.user_id, Amount: centsToAmount(r.share_cents) })),
    });
  } catch (e) {
    return res.status(500).json({ code: "INTERNAL_ERROR", message: String(e) });
  }
}

module.exports = { getExpenseSplits, putExpenseSplits };



// async function putExpenseSplits(req, res) {
//   const userId = getUserId(req);
//   if (!userId) return res.status(401).json({ code: "UNAUTHORIZED", message: "Missing credentials" });

//   const tripId = req.params.tripid;
//   const expenseId = req.params.expenseid;

//   // verification of trip membership
//   const mem = await assertTripMember(userId, tripId);
//   if (mem.error) return res.status(500).json({ code: "INTERNAL_ERROR", details: mem.error });
//   if (!mem.ok) return res.status(403).json({ code: "FORBIDDEN", message: "Not a member of this trip" });

//   // verification of expense
//   const exp = await getExpenseAndCheckTrip(expenseId, tripId);
//   if (exp.error) return res.status(500).json({ code: "INTERNAL_ERROR", details: exp.error });
//   if (exp.notFound) return res.status(404).json({ code: "NOT_FOUND", message: "Expense not found" });
//   if (exp.wrongTrip) return res.status(404).json({ code: "NOT_FOUND", message: "Expense not in this trip" });

//   const body = req.body || {};
//   const splits = body.Splits;

//   if (!Array.isArray(splits) || splits.length === 0) {
//     return res.status(400).json({ code: "BAD_REQUEST", message: "Body must include Splits: [{ PersonID, Amount }]" });
//   }

//   let splits = body.Splits;

//   if (!splits && Array.isArray(body.Participants) && body.Participants.length > 0) {
//     const participants = body.Participants.map(Number);
//     const amount = Number(exp.expense.amount_cents);
//     const n = participants.length;

//     const base = Math.floor(amount / n);
//     let rem = amount % n;

//     splits = participants.map((pid) => {
//       const share = base + (rem > 0 ? 1 : 0);
//       if (rem > 0) rem -= 1;
//       return { PersonID: pid, Amount: centsToAmount(share) };
//     });
//   }

//   // Convert + validate
//   const rows = [];
//   let total = 0;

//   for (const s of splits) {
//     const personId = s.PersonID ?? s.user_id;
//     const amount = s.Amount ?? s.amount;
//     if (personId == null || amount == null) {
//       return res.status(400).json({ code: "BAD_REQUEST", message: "Each split needs PersonID and Amount" });
//     }

//     const cents = toCents(amount);
//     if (cents == null || cents < 0) {
//       return res.status(400).json({ code: "BAD_REQUEST", message: "Invalid Amount in splits" });
//     }

//     rows.push({
//       expense_id: Number(expenseId),
//       user_id: Number(personId),
//       share_cents: cents,
//     });
//     total += cents;
//   }

//   // sum must equal expense amount
//   if (total !== Number(exp.expense.amount_cents)) {
//     return res.status(400).json({
//       code: "BAD_REQUEST",
//       message: `Split amounts must sum to expense Amount (${centsToAmount(exp.expense.amount_cents)})`,
//     });
//   }

//   // all users in splits must be members of trip
//   const userIds = rows.map((r) => r.user_id);
//   const { data: members, error: memErr } = await supabase
//     .from("trip_members")
//     .select("user_id")
//     .eq("trip_id", tripId)
//     .in("user_id", userIds);

//   if (memErr) return res.status(500).json({ code: "INTERNAL_ERROR", details: memErr });

//   const memberSet = new Set((members || []).map((m) => Number(m.user_id)));
//   for (const uid of userIds) {
//     if (!memberSet.has(Number(uid))) {
//       return res.status(400).json({ code: "BAD_REQUEST", message: `User ${uid} is not a member of this trip` });
//     }
//   }

//   // Replace all splits for this expense:
//   const { error: delErr } = await supabase
//     .from("expense_splits")
//     .delete()
//     .eq("expense_id", expenseId);

//   if (delErr) return res.status(500).json({ code: "INTERNAL_ERROR", details: delErr });

//   const { data: inserted, error: insErr } = await supabase
//     .from("expense_splits")
//     .insert(rows)
//     .select();

//   if (insErr) return res.status(500).json({ code: "INTERNAL_ERROR", details: insErr });

//   return res.status(200).json({
//     Splits: (inserted || []).map((r) => ({ PersonID: r.user_id, Amount: centsToAmount(r.share_cents) })),
//   });
// }

// module.exports = { getExpenseSplits, putExpenseSplits };

