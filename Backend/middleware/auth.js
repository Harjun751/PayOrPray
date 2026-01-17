
// middleware/auth.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv/config');


// Server-side Supabase client (never expose service_role in frontend)
const supabase = createClient(
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
        const { data, error } = await supabase.auth.getUser(token);

        if (error || !data?.user) {
            return res.status(401).json({ error: "Invalid or expired token" });
        }

        // Attach user info to request object
        req.user = data.user;   // { id, email, role, ... }
        console.log(data.user);

        next();
    } catch (e) {
        return res.status(500).json({ error: "Auth verification failed" });
    }
}
module.exports = verifyJWT;
