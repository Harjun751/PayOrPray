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

module.exports = {getAllExpenses};
