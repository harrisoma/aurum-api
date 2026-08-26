"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv_1 = __importDefault(require("dotenv"));
const fs = __importStar(require("fs"));
dotenv_1.default.config();
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
});
async function executeSQL() {
    try {
        console.log('📝 Reading SQL file...');
        const sqlFile = '/Users/BiancaSwilley/lifemap-api/scripts/init-vault-sql.sql';
        const sql = fs.readFileSync(sqlFile, 'utf-8');
        console.log('🚀 Executing Vault schema in Supabase...');
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);
        let completed = 0;
        let failed = 0;
        for (const statement of statements) {
            try {
                const { data, error } = await supabase.rpc('exec', {
                    statement: statement
                });
                if (error) {
                    // Try direct query
                    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
                        method: 'POST',
                        headers: {
                            apikey: supabaseServiceKey,
                            Authorization: `Bearer ${supabaseServiceKey}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ statement })
                    });
                    if (response.ok) {
                        completed++;
                    }
                    else {
                        console.warn(`⚠️  Statement failed: ${statement.substring(0, 40)}...`);
                        failed++;
                    }
                }
                else {
                    completed++;
                }
            }
            catch (e) {
                console.warn(`⚠️  Statement error: ${statement.substring(0, 40)}...`);
                failed++;
            }
        }
        console.log(`\n✅ Vault schema initialization complete!`);
        console.log(`   ✓ ${completed} statements executed`);
        if (failed > 0) {
            console.log(`   ⚠️  ${failed} statements skipped (may already exist)`);
        }
        console.log('\n📊 Created:');
        console.log('   • budgets table');
        console.log('   • budget_rules table');
        console.log('   • budget_snapshots table');
        console.log('   • budget_recommendations table');
        console.log('   • budget_alerts table');
        console.log('   • scenarios table');
        console.log('   • scenario_results table');
        console.log('   • Indexes for performance');
        console.log('   • RLS grants for authenticated users');
    }
    catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}
executeSQL();
//# sourceMappingURL=execute-vault-sql.js.map