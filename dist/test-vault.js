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
async function testVault() {
    try {
        console.log('🧪 Testing Vault Endpoints\n');
        // Create test user
        console.log('1️⃣  Creating test user...');
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: 'vault-test@lifemap.ai',
            password: 'TestPassword123!',
            email_confirm: true,
        }).catch(() => ({ data: null, error: 'User may already exist' }));
        if (authError && authError !== 'User may already exist') {
            throw authError;
        }
        // Get user or use existing
        const { data: users } = await supabase.auth.admin.listUsers();
        const testUser = users?.users.find(u => u.email === 'vault-test@lifemap.ai') || users?.users[0];
        if (!testUser) {
            console.log('❌ No test user found');
            return;
        }
        console.log(`✅ Test user: ${testUser.email} (ID: ${testUser.id})\n`);
        // Create JWT token
        const { data: jwtData } = await supabase.auth.admin.createSession(testUser.id);
        const token = jwtData?.session?.access_token;
        if (!token) {
            console.log('❌ Could not create session token');
            return;
        }
        console.log('2️⃣  Testing Vault Endpoints\n');
        const baseUrl = 'http://localhost:4000/api/vault';
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
        // Test 1: Budget Status
        console.log('📊 GET /vault/status');
        const statusRes = await fetch(`${baseUrl}/status`, { headers });
        const status = await statusRes.json();
        console.log(`Status: ${statusRes.status}`);
        console.log(`Summary: ${JSON.stringify(status.summary, null, 2)}\n`);
        // Test 2: Recommendations
        console.log('💡 GET /vault/recommendations');
        const recRes = await fetch(`${baseUrl}/recommendations`, {
            method: 'POST',
            headers
        });
        const rec = await recRes.json();
        console.log(`Status: ${recRes.status}`);
        console.log(`Recommendations: ${rec.recommendations?.length || 0} found`);
        if (rec.recommendations?.length > 0) {
            console.log(`Sample: ${JSON.stringify(rec.recommendations[0], null, 2)}\n`);
        }
        // Test 3: Forecast
        console.log('📈 GET /vault/forecast');
        const forecastRes = await fetch(`${baseUrl}/forecast`, { headers });
        const forecast = await forecastRes.json();
        console.log(`Status: ${forecastRes.status}`);
        console.log(`Analysis: ${JSON.stringify(forecast.analysis, null, 2)}\n`);
        // Test 4: Insights (AI-powered with DeepSeek)
        console.log('🤖 GET /vault/insights (DeepSeek AI)');
        const insightsRes = await fetch(`${baseUrl}/insights`, { headers });
        const insights = await insightsRes.json();
        console.log(`Status: ${insightsRes.status}`);
        console.log(`Provider: ${insights.provider}`);
        console.log(`Model: ${insights.model}`);
        console.log(`Insights: ${JSON.stringify(insights.insights, null, 2)}\n`);
        // Test 5: Monthly Recommendations
        console.log('📋 GET /vault/recommendations-monthly (AI)');
        const monthlyRes = await fetch(`${baseUrl}/recommendations-monthly`, { headers });
        const monthly = await monthlyRes.json();
        console.log(`Status: ${monthlyRes.status}`);
        console.log(`Provider: ${monthly.provider}`);
        console.log(`Recommendations: ${JSON.stringify(monthly.recommendations, null, 2)}\n`);
        // Test 6: Dashboard
        console.log('🎯 GET /vault/dashboard (Complete snapshot)');
        const dashRes = await fetch(`${baseUrl}/dashboard`, { headers });
        const dash = await dashRes.json();
        console.log(`Status: ${dashRes.status}`);
        console.log(`Summary: ${JSON.stringify(dash.summary, null, 2)}\n`);
        console.log('✅ All tests complete!');
        console.log(`\n🔑 Test token (valid for 1 hour):`);
        console.log(token);
    }
    catch (error) {
        console.error('❌ Test error:', error);
    }
}
testVault();
//# sourceMappingURL=test-vault.js.map