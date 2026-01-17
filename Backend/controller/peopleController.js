const supabase = require('../database.js');

async function getPeople(req, res) {
    const userId = req.user.id;

    const { data, error } = await supabase.from('trip_members')
        .select()
        .eq("trip_id", req.params.tripId);

    if (error != null) {
        return res.send(error);
    }

    const ids = data.map(m => m.user_id);

    if (!(ids.includes(userId))) {
        return res.status(403).json({ "code": "403", "message": "Can't fetch info for a group you're not in!"});
    }

    let users;
    {
        const { data, error } = await supabase
            .from('users')
            .select('id, name, phone_no')
            .in('id', ids);
        if (error != null) {
            return res.send(error);
        }
        users = data;
    }
    return res.status(200).json(users);

}

module.exports = { getPeople };
