
// middleware/auth.js
const { createClient } = require('@supabase/supabase-js');
const supabase = require('../database.js');
require('dotenv/config');


// Server-side Supabase client (never expose service_role in frontend)
const supabaseCli = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

async function verifyJWT(req, res, next) {
    try {
        const authHeader = req.headers.authorization || "";
        const token = authHeader.startsWith("Bearer ")
            ? authHeader.slice(7)
            : null;

        if (!token) {
            return res.status(401).json({ error: "Missing Bearer token" });
        }

        // Fully verify + decode JWT
        let user;
        {
            const { data, error } = await supabaseCli.auth.getUser(token);

            if (error || !data?.user) {
                return res.status(401).json({ error: "Invalid or expired token" });
            }
            user = data.user;
        }

        let id;
        {
            const { data, error } = await supabase.from('users')
                .select()
                .eq("auth_user_id", user.id)
                .single();
            if (error != null) {
                return res.status(500).json({ "Message": "Failed" })
            }
            id = data.id;
        }


        // Attach user info to request object
        req.user = { "id": id };
        req.user.details = user;

        next();
    } catch (e) {
        return res.status(500).json({ error: "Auth verification failed" });
    }
}
module.exports = verifyJWT;
