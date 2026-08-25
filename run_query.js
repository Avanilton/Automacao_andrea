const mysql = require('mysql2/promise');

async function getSchema() {
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
        const results = {};

        for (const table of tables) {
            try {
                const [rows] = await connection.execute(`SHOW COLUMNS FROM ${table}`);
                results[table] = rows.map(r => r.Field);
            } catch (e) {
                results[table] = e.message;
            }
        }

        console.log(JSON.stringify(results, null, 2));
    } catch (e) {
        console.error("Connection error:", e.message);
    } finally {
        if (connection) await connection.end();
    }
}

getSchema();
