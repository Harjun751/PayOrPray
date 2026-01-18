const supabase = require("../database.js");

async function getAllExpenses(tripId,userId) {
    const { data, error } = await supabase
    .from("expense")
    .select(`
        *,
        expense_splits (
            user_id,
            share_cents
        ),
        payer:users!expense_payer_fkey (
            id,
            name,
            phone_no
        )
    `)
    .eq("trip_id", tripId);

    if (error) throw error;
    return data;

    if (error) throw error;
    return data;
}

async function addExpense(tripId, userId, title, currency, amount_cents, notes, category, splits) {
    // 1. Insert the expense
    const { data: expenseData, error: expenseError } = await supabase
        .from("expense")
        .insert({
            payer: userId,
            title,
            currency,
            amount_cents,
            notes,
            category,
            trip_id: tripId
        })
        .select()
        .single();

    if (expenseError) throw expenseError;
    if (!expenseData || !expenseData.id) throw new Error("Expense creation failed");
    console.log(expenseData)
    // 2. Insert splits if provided
    if (Array.isArray(splits) && splits.length > 0) {
        const splitsPayload = splits.map(split => ({
            expense_id: expenseData.id,
            user_id: split.user_id,
            share_cents: split.share_cents
        }));

        const { error: splitsError } = await supabase
            .from('expense_splits')
            .insert(splitsPayload);

        if (splitsError) throw splitsError;
    }

    return expenseData;
}

async function deleteExpense(expenseId){
    const {data, error} = await supabase
    .from ('expense')
    .delete()
    .eq('id',expenseId)
}

async function updateExpense(expenseId,title,currency,amount_cents,notes,category,payer_id, splits){
    const {data, error} = await supabase
    .from('expense')
    .update({title:title, currency:currency, amount_cents:amount_cents, notes:notes, category:category, payer_id:payer_id})
    .eq('id', expenseId)

    const {error: delError} = await supabase
    .from('expense_splits')
    .delete()
    .eq('expense_id', expenseId)

    if (delError) throw delError

    // 3. Insert new splits if provided
    if (Array.isArray(splits) && splits.length > 0) {
        const splitsPayload = splits.map(split => ({
            expense_id: expenseId,
            user_id: split.user_id,
            share_cents: split.share_cents
        }));

        const { error: splitsError } = await supabase
            .from('expense_splits')
            .insert(splitsPayload);

        if (splitsError) throw splitsError;
    }

    return data;
}

module.exports = {getAllExpenses, addExpense, deleteExpense, updateExpense};
