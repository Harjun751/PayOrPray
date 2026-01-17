const supabase = require('../database.js');

async function getOwed(req, res) {
    const userId = req.user.id;
    const tripId = req.params.tripId;

    let owed = await getOwedFor(userId, tripId);

    return res.status(200).json({ "owed": owed } );
}



async function getOwedFor(userId, tripId) {
    let expenseList;
    {
        const { data, error } = await supabase.from('expense')
            .select()
            .eq("trip_id", tripId);

        if (error != null) {
            return res.send(error);
        }
        expenseList = data;
    }

    let inSum = expenseList
        .filter(x => x.payer === userId)
        .map(x => x.amount_cents)
        .reduce((acc, curr) => acc + curr, 0)

    let expenseIds = expenseList.map(x => x.id);


    let outSum;

    {
        const { data, error } = await supabase.from('expense_splits')
            .select()
            .in("expense_id", expenseIds)
            .eq("user_id", userId);

        if (error != null) {
            return res.send(error);
        }
        outSum = data
            .map(x => x.share_cents)
            .reduce((acc, curr) => acc + curr, 0)
    }
    return inSum - outSum;
}

module.exports = { getOwed };
