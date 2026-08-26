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
async function checkBudgetsSchema() {
    try {
        console.log('🔍 Checking if budgets table exists in info_schema...\n');
        // Try querying the budgets table metadata
        const { data: columns } = await supabase
            .from('information_schema.columns')
            .select('column_name, data_type')
            .eq('table_name', 'budgets')
            .eq('table_schema', 'public');
        if (columns && columns.length > 0) {
            console.log('Budgets table columns:');
            columns.forEach((col) => {
                console.log(`  • ${col.column_name} (${col.data_type})`);
            });
        }
        else {
            // Try another approach - query the table directly
            console.log('Checking via direct query...');
            const { data: sampleData, error } = await supabase
                .from('budgets')
                .select('*')
                .limit(1);
            if (error) {
                console.log('Table exists but query failed:', error.message);
            }
            else if (!sampleData || sampleData.length === 0) {
                console.log('Table appears to exist but is empty');
            }
        }
    }
    catch (error) {
        console.error('Error:', error);
    }
}
checkBudgetsSchema();
//# sourceMappingURL=check-budgets-schema.js.map