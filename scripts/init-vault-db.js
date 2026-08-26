#!/usr/bin/env node

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function initVault() {
  try {
    console.log('🔄 Initializing Vault schema...\n');

    // Read SQL file
    const sqlPath = path.join(__dirname, '../src/services/vault-schema.sql');
    const sql = fs.readFileSync('/tmp/init-vault.sql', 'utf-8');

    // Split statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements\n`);

    let success = 0;
    let failed = 0;

    for (const statement of statements) {
      try {
        console.log(`⏳ Executing: ${statement.substring(0, 60)}...`);

        const { data, error } = await supabase.rpc('exec', { sql: statement });

        if (error) {
          // Some errors are expected (IF NOT EXISTS)
          if (error.message.includes('already exists') || error.message.includes('UNIQUE constraint')) {
            console.log('✓ Already exists (OK)');
            success++;
          } else {
            console.warn('⚠️  ' + error.message);
            failed++;
          }
        } else {
          console.log('✅ Success');
          success++;
        }
      } catch (e) {
        console.warn('⚠️  ' + e.message);
        failed++;
      }
    }

    console.log(`\n✅ Vault schema initialization complete!`);
    console.log(`   Successful: ${success}`);
    console.log(`   Warnings: ${failed}\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

initVault();
