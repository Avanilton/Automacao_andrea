const mysql = require('mysql2/promise');
const fs = require('fs');

async function runNewQuery() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: 'sistemasnovacorp.com.br',
            port: 5643,
            user: 'Intelligence',
            password: '@bv2026@',
            database: 'novacorpconect'
        });

        const sql = `
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

        console.log("Executando a consulta...");
        const [rows] = await connection.query(sql);
        
        fs.writeFileSync('resultado_condado_novo.json', JSON.stringify({
            status: "success",
            total_linhas: rows.length,
            data: rows
        }, null, 2));

        console.log(`Consulta finalizada. ${rows.length} linhas retornadas.`);

    } catch (e) {
        console.error("Erro na consulta:");
        console.error(e.message);
        fs.writeFileSync('resultado_condado_novo.json', JSON.stringify({
            status: "error",
            message: e.message
        }, null, 2));
    } finally {
        if (connection) await connection.end();
    }
}

runNewQuery();
