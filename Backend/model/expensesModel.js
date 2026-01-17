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

async function addExpense(tripId,userId,title,currency,amount_cents,notes,category){
    const {data, error} = await supabase
    .from("expense")
    .insert({payer:userId, title:title, currency:currency, amount_cents:amount_cents, notes:notes, category:category, trip_id:tripId})

    if (error) throw error;
    return data;
}

async function deleteExpense(expenseId){
    const {data, error} = await supabase
    .from ('expense')
    .delete()
    .eq('id',expenseId)
}

module.exports = {getAllExpenses, addExpense, deleteExpense};
