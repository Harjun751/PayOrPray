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

async function searchPerson(req, res) {
    let data, error;

    if (req.body.phone_no != null) {
        ({ data, error } = await supabase.from('users')
            .select('name, id, phone_no')
            .ilike('phone_no', `%${req.body.phone_no}%`));
    } else if (req.body.name != null) {
        ({ data, error } = await supabase.from('users')
            .select('name, id, phone_no')
            .ilike('name', `%${req.body.name}%`));
    } else {
        return res.status(400).json({ code: '400', message: 'Provide name or phone_no' });
    }

    if (error) return res.status(500).send(error);
    return res.status(200).json(data);
}
async function getMe(req, res) {
    const userId = req.user.id;

    const { data, error } = await supabase.from('users')
        .select('id, name, phone_no')
        .eq('id', userId)
        .single();

    if (error != null) {
        return res.send(error)
    }
    return res.status(200).json(data);
}

module.exports = { getPeople, searchPerson, getMe };
