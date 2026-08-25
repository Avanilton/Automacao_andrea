const mysql = require('mysql2/promise');

async function getColumns() {
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
                const [rows] = await connection.execute(`SELECT * FROM ${table} LIMIT 1`);
                if (rows.length > 0) {
                    results[table] = Object.keys(rows[0]);
                } else {
                    results[table] = 'Empty table';
                }
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

getColumns();
