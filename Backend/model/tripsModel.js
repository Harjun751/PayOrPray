// Backend/model/tripsModel.js  (Supabase-js version)
const supabase = require("../database.js");

function genInviteCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase(); // e.g. "K3P9QZ"
}

async function getTripsForUser(userId, page = 1, pageSize = 20) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // 1) membership -> tripIds
  const { data: memberships, error: mErr } = await supabase
    .from("trip_members")
    .select("trip_id")
    .eq("user_id", userId);

  if (mErr) throw mErr;

  const tripIds = (memberships || []).map((m) => m.trip_id);
  if (tripIds.length === 0) return [];

  // 2) trips (paged)
  const { data: trips, error: tErr } = await supabase
    .from("trips")
    .select("id, owner_id, name, created_at")
    .in("id", tripIds)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (tErr) throw tErr;

  const pagedTripIds = (trips || []).map((g) => g.id);
  if (pagedTripIds.length === 0) return [];

  // 3) people per trip
  // IMPORTANT: this assumes you have FK: group_members.user_id -> users.id
  // so we can do a join select.
  const { data: peopleRows, error: pErr } = await supabase
    .from("trip_members")
    .select("trip_id, users(id, name, phone_no)")
    .in("trip_id", pagedTripIds);
  if (pErr) throw pErr;

  const peopleByTrip = new Map();
  for (const r of peopleRows || []) {
    const tripId = r.group_id;
    const u = r.users;
    if (!u) continue;

    if (!peopleByTrip.has(tripId)) peopleByTrip.set(tripId, []);
    peopleByTrip.get(tripId).push({
      PersonID: u.id,
      Name: u.name,
      Number: String(u.phone_no ?? ""),
    });
  }

  // 4) format exactly like OpenAPI
  return (trips || []).map((g) => ({
    TripID: g.id,
    Owner: g.owner_id,
    Description: g.name,
    People: peopleByTrip.get(g.id) || [],
  }));
}

async function createTrip({ ownerId, name, description }) {
  const invite_code = genInviteCode();

  // 1) create group
  const { data: created, error: cErr } = await supabase
    .from("trips")
    .insert([
      {
        name: name,
        owner_id: ownerId,
        description: description,
        invite_code: invite_code,
      },
    ])
    .select("id, name, owner_id")
    .single();

  if (cErr) throw cErr;

  // 2) add owner as member
  const { error: gmErr } = await supabase
    .from("trip_members")
    .insert([{ trip_id: created.id, user_id: ownerId }]);

  if (gmErr) throw gmErr;

  return {
    TripID: created.id,
    Owner: created.owner_id,
    Description: created.name,
    People: [],
  };
}

module.exports = { getTripsForUser, createTrip};


// // Backend/model/tripsModel.js
// // require("dotenv").config();
// // const pgp = require("pg-promise")();
// // const db = pgp(process.env.DATABASE_CONN_STRING);

// const supabase = require("../database.js");

// async function getTripsForUser(userId, page = 1, pageSize = 20) {
//   const offset = (page - 1) * pageSize;
//   const to = from + pageSize - 1;

//   const trips = await db.any(
//     `
//     SELECT g.id AS "TripID",
//            g.owner_id AS "Owner",
//            g.name AS "Description"
//     FROM public.groups g
//     JOIN public.group_members gm ON gm.group_id = g.id
//     WHERE gm.user_id = $1
//     ORDER BY g.created_at DESC
//     LIMIT $2 OFFSET $3
//     `,
//     [userId, pageSize, offset]
//   );

//   if (trips.length === 0) return [];

//   const tripIds = trips.map((t) => t.TripID);

//   const people = await db.any(
//     `
//     SELECT gm.group_id AS "TripID",
//            u.id AS "PersonID",
//            u.name AS "Name",
//            u.phone_no::text AS "Number"
//     FROM public.group_members gm
//     JOIN public.users u ON u.id = gm.user_id
//     WHERE gm.group_id IN ($1:csv)
//     ORDER BY gm.group_id, u.id
//     `,
//     [tripIds]
//   );

//   const peopleByTrip = new Map();
//   for (const row of people) {
//     if (!peopleByTrip.has(row.TripID)) peopleByTrip.set(row.TripID, []);
//     peopleByTrip.get(row.TripID).push({
//       PersonID: row.PersonID,
//       Name: row.Name,
//       Number: row.Number,
//     });
//   }

//   return trips.map((t) => ({ ...t, People: peopleByTrip.get(t.TripID) || [] }));
// }

// function genInviteCode() {
//   return Math.random().toString(36).slice(2, 8).toUpperCase();
// }

// async function createTrip({ ownerId, description }) {
//   // pg-promise transaction
//   return db.tx(async (t) => {
//     const inviteCode = genInviteCode();
//     const trip = await t.one(
//       `
//       INSERT INTO public.groups (created_at, name, owner_id, invite_code)
//       VALUES (now(), $1, $2, $3)
//       RETURNING id AS "TripID", name AS "Description", owner_id AS "Owner"
//       `,
//       [description, ownerId, inviteCode]
//     );

//     console.log("Creating trip:", { description, ownerId, inviteCode });
//     await t.none(
//       `INSERT INTO public.group_members (group_id, user_id) VALUES ($1, $2)`,
//       [trip.TripID, ownerId]
//     );

//     return { ...trip, People: [] };
//   });
// }

// module.exports = { getTripsForUser, createTrip };
