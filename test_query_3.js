const mysql = require('mysql2/promise');

async function testQuery3() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: 'sistemasnovacorp.com.br',
            port: 5643,
            user: 'Intelligence',
            password: '@bv2026@',
            database: 'novacorpconect'
        });

        const query = `
        SELECT DISTINCT
            Tbcliente.IDCLIENTE,
            Tbcliente.NOMECLIENTE,
            Tbcliente.FONERe,
            Tbcliente.FONECE,
            Tbcliente.FONECO,
            Tbcliente.DDDRE,
            Tbcliente.DDDCE,
            Tbcliente.DDDCO,
            Tbcliente.APTO,
            Tbimovel.NOMEFANTASIA,
            Tbbloco.BLOCO,
            TbBoleto.DATAVECTO,
            TbBoleto.VALORPARC,
            TbBoleto.JUROS,
            TbBoleto.CORRECAO,
            TbBoleto.MULTA,
            TbBoleto.ENCARGO,
            TbBoleto.TOTAL,
            TbBoleto.MESREF,
            TbBoleto.ORIGEM,
            TbBoleto.NUMERODOCUMENTO,
            TbBoleto.PAGO,
            TbBoleto.IDFUNCIONARIOINCL,
            TbBoleto.IDFUNCIONARIOALT,
            TbFuncionario.LOGIN,
            TbBoleto.DATAPGTO,
            TbBoleto.NRPARCELA,
            TbBoleto.DATAEDICAO,
            TBSITUACAO.SITUACAO

        FROM
            Tbimovel,
            Tbcliente,
            TbBoleto,
            Tbbloco,
            TbFuncionario,
            TBSITUACAO

        WHERE
            TbFuncionario.IDFUNCIONARIO = TbBoleto.IDFUNCIONARIOINCL
            AND TbFuncionario.GRUPO = 75

            AND Tbimovel.IDEMPRESA = Tbcliente.IDEMPRESA
            AND Tbimovel.IDIMOVEL = Tbcliente.IDIMOVEL

            AND Tbcliente.IDEMPRESA = TbBoleto.IDEMPRESA
            AND Tbcliente.IDCLIENTE = TbBoleto.IDCLIENTE
            AND Tbcliente.IDIMOVEL = TbBoleto.IDIMOVEL

            AND Tbcliente.IDEMPRESA = Tbbloco.IDEMPRESA
            AND Tbcliente.IDIMOVEL = Tbbloco.IDIMOVEL
            AND Tbcliente.IDBLOCO = Tbbloco.IDBLOCO

            AND Tbcliente.IDEMPRESA = TBSITUACAO.IDEMPRESA
            AND Tbcliente.IDSITUACAO = TBSITUACAO.IDSITUACAO

            AND Tbcliente.IDEMPRESA = 75
            AND TbBoleto.PAGO = FALSE
            AND TbBoleto.CANCELADO = FALSE
            AND TbBoleto.ORIGEM = 5

            AND TbBoleto.DATAVECTO >= '2026-08-07'
            AND TbBoleto.DATAVECTO <= '2026-08-07'

        ORDER BY
            Tbimovel.NOMEFANTASIA,
            Tbbloco.BLOCO,
            Tbcliente.APTO,
            TbBoleto.DATAVECTO;
        `;

        try {
            const [rows] = await connection.query(query);
            console.log(JSON.stringify(rows, null, 2));
        } catch (e) {
            console.error("Query Error:", e.message);
        }

    } catch (e) {
        console.error("Connection error:", e.message);
    } finally {
        if (connection) await connection.end();
    }
}

testQuery3();
