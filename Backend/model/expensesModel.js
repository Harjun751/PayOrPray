const supabase = require("../database.js");

async function getAllExpenses(tripId,userId) {
    const { data, error } = await supabase
    .from("expenses")
    .select(`
        *,
        trips!inner (
        group_members!group_members_group_id_fkey!inner ( user_id )
        )
    `)
    .eq("trips_id", tripId)
    .eq("trips.group_members.user_id", userId);

    if (error) throw error;
    return data;
}

async function addExpense(tripId,userId,title,currency,amount_cents,notes,category){
    const {data, error} = await supabase
    .from("expenses")
    .insert({payer_id:userId, title:title, currency:currency, amount_cents:amount_cents, notes:notes, category:category, trips_id:tripId})

    if (error) throw error;
    return data;
}

module.exports = {getAllExpenses, addExpense};
