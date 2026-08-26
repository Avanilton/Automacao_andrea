const mysql = require('mysql2/promise');

async function checkSchema() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: 'sistemasnovacorp.com.br',
            port: 5643,
            user: 'Intelligence',
            password: '@bv2026@',
            database: 'novacorpconect'
        });

        const tables = ['tbCaixaMovi', 'tbTipoPgto', 'tbConta'];

        for (const table of tables) {
            console.log(`\n=== Schema for ${table} ===`);
            try {
                const [rows] = await connection.query(`DESCRIBE ${table}`);
                console.log(rows.map(r => r.Field).join(', '));
            } catch (e) {
                console.error(`Erro ao descrever ${table}:`, e.message);
            }
        }

    } catch (e) {
        console.error("Connection error:", e.message);
    } finally {
        if (connection) await connection.end();
    }
}

checkSchema();
