"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = exports.supabaseAnon = exports.supabaseAdmin = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';
if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase credentials');
}
// Service role client (for server-side operations)
exports.supabaseAdmin = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
});
// Anon client (for user operations)
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
exports.supabaseAnon = (0, supabase_js_1.createClient)(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
});
// Default export uses admin client for server-side operations
exports.supabase = exports.supabaseAdmin;
//# sourceMappingURL=supabase.js.map