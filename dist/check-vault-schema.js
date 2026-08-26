"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
});
async function checkSchema() {
    try {
        console.log('🔍 Checking Vault schema...\n');
        const tables = ['budgets', 'budget_rules', 'budget_snapshots', 'budget_recommendations', 'budget_alerts', 'scenarios', 'scenario_results'];
        for (const table of tables) {
            const { data, error } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });
            if (error) {
                console.log(`❌ ${table}: NOT FOUND (needs creation)`);
            }
            else {
                console.log(`✅ ${table}: EXISTS`);
            }
        }
    }
    catch (error) {
        console.error('Error:', error);
    }
}
checkSchema();
//# sourceMappingURL=check-vault-schema.js.map