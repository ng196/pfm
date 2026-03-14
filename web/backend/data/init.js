import pool from './db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initDatabase() {
    const client = await pool.connect();
    
    try {
        console.log('🔧 Initializing database...');
        
        // Read and execute schema
        const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
        await client.query(schema);
        console.log('✅ Schema created');
        
        // Read and execute seed data
        const seed = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
        await client.query(seed);
        console.log('✅ Seed data inserted');
        
        console.log('🎉 Database initialization complete!');
    } catch (err) {
        console.error('❌ Database initialization failed:', err.message);
        throw err;
    } finally {
        client.release();
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    initDatabase()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

export default initDatabase;
