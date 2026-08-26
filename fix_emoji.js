const fs = require('fs');
let text = fs.readFileSync('c:/Users/Administrador/Documents/Projetos BV/Automacao_andrea/js/app.js', 'utf8');

text = text.replace(/Vence amanh[^\"]+\">[^V]+Vence Amanh[^\<]+/g, 'Vence amanhã\">⚠️ Vence Amanhã');
text = text.replace(/Atrasado\">[^A]+Atrasado/g, 'Atrasado\">⚠️ Atrasado');
text = text.replace(/margin-left: 5px;\">[^V]+Vence Amanh[^\<]+/g, 'margin-left: 5px;\">⚠️ Vence Amanhã');
text = text.replace(/margin-left: 5px;\">[^A]+Atrasado/g, 'margin-left: 5px;\">⚠️ Atrasado');

fs.writeFileSync('c:/Users/Administrador/Documents/Projetos BV/Automacao_andrea/js/app.js', text, 'utf8');
console.log('Fixed with regex script');
