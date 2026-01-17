// Backend/model/tripsModel.js
require("dotenv").config();
const pgp = require("pg-promise")();
const db = pgp(process.env.DATABASE_CONN_STRING);

async function getTripsForUser(userId, page = 1, pageSize = 20) {
  const offset = (page - 1) * pageSize;

  const trips = await db.any(
    `
    SELECT g.id AS "TripID",
           g.owner_id AS "Owner",
           g.name AS "Description"
    FROM public.groups g
    JOIN public.group_members gm ON gm.group_id = g.id
    WHERE gm.user_id = $1
    ORDER BY g.created_at DESC
    LIMIT $2 OFFSET $3
    `,
    [userId, pageSize, offset]
  );

  if (trips.length === 0) return [];

  const tripIds = trips.map((t) => t.TripID);

  const people = await db.any(
    `
    SELECT gm.group_id AS "TripID",
           u.id AS "PersonID",
           u.name AS "Name",
           u.phone_no::text AS "Number"
    FROM public.group_members gm
    JOIN public.users u ON u.id = gm.user_id
    WHERE gm.group_id IN ($1:csv)
    ORDER BY gm.group_id, u.id
    `,
    [tripIds]
  );

  const peopleByTrip = new Map();
  for (const row of people) {
    if (!peopleByTrip.has(row.TripID)) peopleByTrip.set(row.TripID, []);
    peopleByTrip.get(row.TripID).push({
      PersonID: row.PersonID,
      Name: row.Name,
      Number: row.Number,
    });
  }

  return trips.map((t) => ({ ...t, People: peopleByTrip.get(t.TripID) || [] }));
}

function genInviteCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

async function createTrip({ ownerId, description }) {
  // pg-promise transaction
  return db.tx(async (t) => {
    const inviteCode = genInviteCode();
    const trip = await t.one(
      `
      INSERT INTO public.groups (created_at, name, owner_id, invite_code)
      VALUES (now(), $1, $2, $3)
      RETURNING id AS "TripID", name AS "Description", owner_id AS "Owner"
      `,
      [description, ownerId, inviteCode]
    );

    console.log("Creating trip:", { description, ownerId, inviteCode });
    await t.none(
      `INSERT INTO public.group_members (group_id, user_id) VALUES ($1, $2)`,
      [trip.TripID, ownerId]
    );

    return { ...trip, People: [] };
  });
}

module.exports = { getTripsForUser, createTrip };
