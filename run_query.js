const mysql = require('mysql2/promise');
const fs = require('fs');

async function getDescTables() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: 'sistemasnovacorp.com.br',
            port: 5643,
            user: 'Intelligence',
            password: '@bv2026@',
            database: 'novacorpconect'
        });

        const tables = ['tbimovel', 'tbcliente', 'tbBoleto', 'tbbloco', 'TbFuncionario', 'TBSITUACAO'];
        const results = {};

        for (const table of tables) {
            try {
                const [rows] = await connection.query(`DESCRIBE ${table}`);
                results[table] = rows.map(r => r.Field);
            } catch (e) {
                results[table] = e.message;
            }
        }

        fs.writeFileSync('schema_novo_query.json', JSON.stringify(results, null, 2));
        console.log('Schema salvo em schema_novo_query.json');

    } catch (e) {
        console.error("Connection error:", e.message);
    } finally {
        if (connection) await connection.end();
    }
}

getDescTables();
