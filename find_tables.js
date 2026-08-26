const mysql = require('mysql2/promise');

async function showTables() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: 'sistemasnovacorp.com.br',
            port: 5643,
            user: 'Intelligence',
            password: '@bv2026@',
            database: 'novacorpconect'
        });

        const [caixaTables] = await connection.query(`SHOW TABLES LIKE '%caixa%'`);
        console.log("Caixa tables:", caixaTables);
        
        const [pgtoTables] = await connection.query(`SHOW TABLES LIKE '%pgto%'`);
        console.log("Pgto tables:", pgtoTables);

    } catch (e) {
        console.error("Connection error:", e.message);
    } finally {
        if (connection) await connection.end();
    }
}

showTables();
