// Environment variables
require('dotenv').config();

// DB setup
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

module.exports = supabase;
