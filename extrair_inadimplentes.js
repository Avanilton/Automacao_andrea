const mysql = require('mysql2/promise');
const fs = require('fs');

async function fetchInadimplentes() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: 'sistemasnovacorp.com.br',
            port: 5643,
            user: 'Intelligence',
            password: '@bv2026@',
            database: 'novacorpconect'
        });

        // Query 1: Trazendo detalhes dos inadimplentes (com as colunas que existem)
        const query1 = `
        SELECT DISTINCT
            Tbcliente.idCliente,
            Tbcliente.nomeCliente,
            Tbcliente.fonece,
            Tbcliente.foneco,
            Tbcliente.dddce,
            Tbcliente.dddco,
            Tbimovel.nomeFantasia,
            TbBoleto.dataVecto,
            TbBoleto.valorParc,
            TbBoleto.juros,
            TbBoleto.correcao,
            TbBoleto.multa,
            TbBoleto.encargo,
            TbBoleto.total,
            TbBoleto.origem,
            TbBoleto.pago,
            TbBoleto.dataPgto,
            TbBoleto.nrParcela
        FROM
            tbimovel AS Tbimovel
        JOIN tbcliente AS Tbcliente 
            ON Tbimovel.IDEMPRESA = Tbcliente.idEmpresa 
            AND Tbimovel.IDIMOVEL = Tbcliente.idImovel
        JOIN tbboleto AS TbBoleto 
            ON Tbcliente.idEmpresa = TbBoleto.idEmpresa 
            AND Tbcliente.idCliente = TbBoleto.idCliente 
            AND Tbcliente.idImovel = TbBoleto.idImovel
        WHERE
            Tbcliente.idEmpresa = 75
            AND TbBoleto.pago = FALSE
            AND TbBoleto.cancelado = FALSE
        ORDER BY
            TbBoleto.dataVecto DESC
        LIMIT 50; -- Limitando para não gerar um arquivo gigante, pegando os 50 mais recentes
        `;

        // Query 2: Resumo agrupado por origem para você ver quais "origens" representam os acordos/jurídico
        const query2 = `
        SELECT 
            TbBoleto.origem,
            COUNT(*) as quantidade_boletos,
            SUM(TbBoleto.total) as valor_total
        FROM tbboleto AS TbBoleto
        WHERE TbBoleto.idEmpresa = 75
          AND TbBoleto.pago = FALSE
          AND TbBoleto.cancelado = FALSE
        GROUP BY TbBoleto.origem;
        `;

        const results = {};

        try {
            console.log("Executando Query 1 (Detalhes)...");
            const [rows1] = await connection.query(query1);
            results.detalhes_inadimplentes = rows1;
        } catch (e) {
            results.erro_query1 = e.message;
        }

        try {
            console.log("Executando Query 2 (Resumo por Origem)...");
            const [rows2] = await connection.query(query2);
            results.resumo_por_origem = rows2;
        } catch (e) {
            results.erro_query2 = e.message;
        }

        fs.writeFileSync('resultado_inadimplentes.json', JSON.stringify(results, null, 2));
        console.log("Dados salvos em resultado_inadimplentes.json");

    } catch (e) {
        console.error("Connection error:", e.message);
    } finally {
        if (connection) await connection.end();
    }
}

fetchInadimplentes();
