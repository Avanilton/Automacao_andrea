const mysql = require('mysql2/promise');

async function getSampleData() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: 'sistemasnovacorp.com.br',
            port: 5643,
            user: 'Intelligence',
            password: '@bv2026@',
            database: 'novacorpconect'
        });

        console.log("=== Sample tbCaixaMovi ===");
        try {
            const [rows] = await connection.query(`SELECT * FROM tbCaixaMovi LIMIT 5`);
            console.log(JSON.stringify(rows, null, 2));
        } catch (e) {
            console.error("Erro:", e.message);
        }

        console.log("=== Sample tbTipoPgto ===");
        try {
            const [rows] = await connection.query(`SELECT * FROM tbTipoPgto LIMIT 5`);
            console.log(JSON.stringify(rows, null, 2));
        } catch (e) {
            console.error("Erro:", e.message);
        }

    } catch (e) {
        console.error("Connection error:", e.message);
    } finally {
        if (connection) await connection.end();
    }
}

getSampleData();
