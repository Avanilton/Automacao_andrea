const mysql = require('mysql2/promise');

async function testQueries() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: 'sistemasnovacorp.com.br',
            port: 5643,
            user: 'Intelligence',
            password: '@bv2026@',
            database: 'novacorpconect'
        });

        const query1 = `
        SELECT
            SUM(
                CASE
                    WHEN M.tipoMvto = 2
                        THEN (M.valorRecebido - M.troco)
                END
            ) AS valorCredito,

            SUM(
                CASE
                    WHEN M.tipoMvto = 1
                        THEN M.valorMvto
                END
            ) AS valorDebito,

            T.tipoPgto,
            M.idTipoPgto

        FROM tbCaixaMovi M,
             tbTipoPgto T

        WHERE M.id.idEmpresa = T.idEmpresa
          AND M.idTipoPgto = T.id.idTipoPgto
          AND M.id.idFuncionario = 1
          AND M.id.idEmpresa = 75
          AND M.transferido = false

        GROUP BY
            T.tipoPgto,
            M.idTipoPgto;
        `;

        const query2 = `
        SELECT
            *
        FROM tbConta
        WHERE inativo = 0
          AND id.idEmpresa = 75;
        `;

        console.log("=== Resultados da Query 1 ===");
        try {
            const [rows1] = await connection.query(query1);
            console.log(JSON.stringify(rows1, null, 2));
        } catch (e) {
            console.error("Erro na Query 1:", e.message);
        }

        console.log("\n=== Resultados da Query 2 ===");
        try {
            const [rows2] = await connection.query(query2);
            console.log(JSON.stringify(rows2, null, 2));
        } catch (e) {
            console.error("Erro na Query 2:", e.message);
        }

    } catch (e) {
        console.error("Connection error:", e.message);
    } finally {
        if (connection) await connection.end();
    }
}

testQueries();
