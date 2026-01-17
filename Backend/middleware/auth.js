
// middleware/auth.js
import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client (never expose service_role in frontend)
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

export async function verifyJWT(req, res, next) {
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

        next();
    } catch (e) {
        return res.status(500).json({ error: "Auth verification failed" });
    }
}
