// src/server.js
// Este arquivo deve ser o ÚNICO ponto de inicialização do servidor Express
// IMPORTANTE: O caminho para './app' deve ser relativo a ESTE arquivo (server.js)
// Se server.js está em src/ e app.js está em src/, o caminho correto é '../app'
const app = require('../app'); // <<< CORREÇÃO AQUI: Ajuste o caminho para '../app'

const db = require('./src/models'); // Importa o módulo de modelos para acesso ao sequelize
const config = require('./src/config/config'); // Importa as configurações

const PORT = config.port || 3001; // Usa a porta da configuração, padrão 3001

// Função para sincronizar o banco de dados (chamada única no startup)
const syncDatabase = async () => {
  try {
    // `sync()` sem opções tenta criar as tabelas se não existirem.
    // Se as tabelas já existem (como sugere o erro anterior), o Sequelize pode gerar erros
    // se tentar criar sequências ou índices que já estão lá.
    // Em produção, migrações (npx sequelize-cli db:migrate) são preferíveis a `sync()`.
    // Para continuar usando sync em dev e lidar com o erro de "já existe", podemos adicionar tratamento.
    
    await db.sequelize.sync(); 
    console.log('Banco de dados sincronizado com sucesso (via server.js).');

  } catch (error) {
    console.error('Erro ao sincronizar o banco de dados:', error);
    // Tratar o erro de unique constraint (tabelas já existem) como aviso em dev, não fatal
    if (error.name === 'SequelizeUniqueConstraintError' || (error.parent && error.parent.code === '23505')) {
        console.warn("Aviso: Erro de sincronização detectado (tabelas/sequências podem já existir). Continuando...");
    } else {
        console.error("ERRO CRÍTICO AO SINCRONIZAR BANCO DE DADOS. Considerar encerrar o processo.", error);
        // Em produção, você pode querer encerrar o processo aqui:
        // process.exit(1); 
    }
  }
};


// Inicia a sincronização do banco de dados e, APÓS isso, inicia o servidor
// Usar IIFE assíncrona para executar sync antes de listen
(async () => {
  
  // Sincroniza antes de iniciar o servidor.
  // Isto é uma escolha de design (sync on startup). Alternativa é rodar migrações manualmente.
  await syncDatabase(); 

  // Inicia o servidor Express
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Ambiente: ${config.nodeEnv}`); // Usa a configuração carregada
  });

})(); // Executa a função assíncrona imediatamente