// src/server.js
// Este arquivo deve ser o ÚNICO ponto de inicialização do servidor Express
const app = require('./app'); // Importa o aplicativo configurado em app.js
const db = require('./src/models'); // Importa o módulo de modelos para acesso ao sequelize
const config = require('./src/config/config'); // Importa as configurações

const PORT = config.port || 3001; // Usa a porta da configuração, padrão 3001

// Função para sincronizar o banco de dados (chamada única no startup)
const syncDatabase = async () => {
  try {
    // { alter: true } tenta ajustar o schema sem apagar dados (útil em dev, mas pode ser lento/arriscado)
    // { force: true } apaga e recria as tabelas (SÓ USE EM DEV E COM CUIDADO)
    // Sem opções, ele tenta criar as tabelas se não existirem.
    // O erro de UniqueConstraint indica que as tabelas já existem.
    // Em produção, você usaria migrations (npx sequelize-cli db:migrate) antes de rodar o servidor.
    // Para este caso específico do erro "categories_id_seq already exists",
    // rodar `sync()` sem force/alter em um DB existente pode gerar esse erro se o Sequelize
    // tentar criar a sequência novamente. Isso geralmente não é fatal, mas é um sintoma
    // de usar `sync()` em vez de migrations em um DB que não está vazio.
    // Para seguir usando sync em dev, a opção `alter: true` pode ajudar, mas não resolve todos os casos.
    // Vou manter a chamada simples `sync()` que estava lá, mas adicionar tratamento de erro para permitir continuar.
    
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
  // await syncDatabase(); // Sincroniza antes de iniciar o servidor
                         // Note: Se o sync levar muito tempo ou falhar criticamente, o listen não rodará.
                         // Dependendo da estratégia (migrations vs sync), pode-se optar por não sincronizar aqui.
                         // Como o log mostra erro de sync, vamos mantê-lo para fins de depuração,
                         // mas lembre-se da recomendação de migrations para prod.
                         
  // Para o contexto de corrigir a dupla inicialização e o sync no app.js,
  // vamos mover a chamada syncDatabase PARA cá e garantir que é chamada apenas uma vez.
  await syncDatabase(); // <<< Única chamada de syncDatabase()

  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    // console.log(`Ambiente: ${process.env.NODE_ENV}`); // NODE_ENV já é logado via configModule
    console.log(`Ambiente: ${config.nodeEnv}`); // Usa a configuração carregada

    // O log 'Servidor rodando na porta 80 no ambiente development' no erro original
    // indica que talvez outro processo ou configuração esteja tentando rodar algo na porta 80
    // ou que uma configuração antiga esteja ativa. Verifique onde mais o servidor pode estar sendo iniciado.

  });

})(); // Executa a função assíncrona imediatamente