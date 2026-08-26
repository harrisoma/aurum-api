import 'dotenv/config';

async function initVaultSchema() {
  try {
    console.log('🔄 Initializing Vault schema...');
    console.log('⚠️  Please run this SQL manually in Supabase dashboard:');
    console.log('');
    console.log('1. Go to SQL Editor in your Supabase dashboard');
    console.log('2. Create a new query');
    console.log('3. Copy the contents of src/services/vault-schema.sql');
    console.log('4. Execute the query');
    console.log('');
    console.log('📁 File location: src/services/vault-schema.sql');
    console.log('');
    console.log('Or use the Supabase CLI:');
    console.log('supabase sql < src/services/vault-schema.sql');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

initVaultSchema();
