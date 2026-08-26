import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function initializeVault() {
  try {
    console.log('🔧 Initializing Vault schema in Supabase...');

    // Read the SQL file
    const sqlPath = path.join(__dirname, 'init-vault-sql.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf-8');

    // Execute raw SQL via Supabase HTTP API
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'POST',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sql: sqlContent
      })
    });

    // Alternative: Use POST to execute SQL
    const execResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ statement: sqlContent })
    }).catch(() => null);

    console.log('✅ Vault schema initialization SQL prepared!');
    console.log('\n📋 SQL Statements to execute:');
    console.log(sqlContent);
    console.log('\n\n💡 Instructions:');
    console.log('1. Go to: https://supabase.com/dashboard');
    console.log('2. Sign in to your account');
    console.log('3. Select your project (zctunbobkokehcirkjuz)');
    console.log('4. Click "SQL Editor" in the left sidebar');
    console.log('5. Click "New Query"');
    console.log('6. Copy and paste the SQL above');
    console.log('7. Click "Run"');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

initializeVault();
