const supabase = require('../database.js');

async function getInvites(req, res) {
    const userId = req.user.id;
    if (!userId) return res.status(401).json({ code: "UNAUTHORIZED", message: "Missing credentials" });

    const { data, error } = await supabase.from('invites')
        .select()
        .eq("trip_id", req.params.tripId);

    if (error != null) {
        return res.send(error);
    } else {
        return res.status(200).json(data);
    }
}

async function getInvitesForUser(req, res) {
    const userId = req.user.id;
    if (!userId) return res.status(401).json({ code: "UNAUTHORIZED", message: "Missing credentials" });
    // check if we need this endpoint - get pending invite for users so they can perform actions
    const { data, error } = await supabase.from('invites')
        .select()
        .eq("user_id", userId)
        .eq("status", "pending");

    if (error != null) {
        return res.send(error);
    }
    return res.send(data);
}

async function addInvite(req, res) {
    const userId = req.user.id;
    if (!userId) return res.status(401).json({ code: "UNAUTHORIZED", message: "Missing credentials" });

    {
        const {data, error} = await supabase.from('trips')
            .select()
            .eq("id", req.params.tripId)
            .single();
        if (error != null) {
            return res.send(error);
        }

        // assert that trip owner == this user id
        if (data.owner_id !== userId) {
            return res.status(401).json({"code": "401", "message": "Only the owner of the trip can invite people!"});
        }
    }

    // Check that the userid is present in the body
    if (req.body.UserID == null) {
        return res.status(400).json({"code":"400", "message": "Body requires UserID" });
    }

    // Create the invite
    let currDate = new Date();
    let thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    const invite = {
      "trip_id": req.params.tripId,
      "user_id": req.body.UserID,
      "status": "pending",
      "created_at": currDate.toISOString(),
      "expires_at": thirtyDaysFromNow.toISOString(),
    }

    const { data, error } = await supabase
        .from('invites')
        .insert(invite)
        .select()
        .single();

    if (error != null) {
        return res.send(error);
    } else {
        return res.send(data);
    }
}

async function acceptInvite(req, res) {
    const userId = req.user.id;
    const inviteId = req.params.inviteid;
    const tripId = req.params.tripId;

    // First check that the userid matches the target of the invite
    {
        const { data, error } = await supabase.from('invites')
            .select()
            .eq("trip_id", tripId)
            .eq("id", inviteId)
            .single();

        if (error != null) {
            return res.send(error);
        }

        if (data.user_id !== userId) {
            return res.status(400).send({ "code": 400, "message": "You can't accept an invite not for you"} )
        }

        if (data.status !== "pending") {
            return res.status(400).send({ "code": 400, "message": "You can't accept an invite that is not pending."} )
        }
    }

    // update the invite to accepted
    {
        const { error } = await supabase.from("invites")
            .update({ "status" : "accepted" })
            .eq("trip_id", tripId).eq("id", inviteId);
        if (error != null) {
            return res.send(error);
        }
    }

    // Add person to the trip
    {
        const { error } = await supabase
            .from('group_members')
            .insert({ "group_id": tripId, "user_id": userId })
        if (error != null) {
            return res.send(error);
        }
    }
    return res.status(200).send("success");
}

async function declineInvite(req, res) {
    const userId = req.user.id;
    const inviteId = req.params.inviteid;
    const tripId = req.params.tripId;

    // First check that the userid matches the target of the invite
    {
        const { data, error } = await supabase.from('invites')
            .select()
            .eq("trip_id", tripId)
            .eq("id", inviteId)
            .single();

        if (error != null) {
            return res.send(error);
        }

        if (data.user_id !== userId) {
            return res.status(400).send({ "code": 400, "message": "You can't decline an invite not for you"} )
        }

        if (data.status !== "pending") {
            return res.status(400).send({ "code": 400, "message": "You can't decline an invite that is not pending."} )
        }
    }

    // update the invite to declined
    {
        const { error } = await supabase.from("invites")
            .update({ "status" : "declined" })
            .eq("trip_id", tripId).eq("id", inviteId);
        if (error != null) {
            return res.send(error);
        }
    }

    return res.status(200).send("success");
}


module.exports = { getInvites, addInvite, acceptInvite, declineInvite, getInvitesForUser };
