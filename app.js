// src/app.js (no backend)
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const allRoutes = require('./src/routes/index.routes'); // Ajuste o caminho se sua pasta src estiver em outro nível
const db = require('./src/models'); // Ajuste o caminho
const configModule = require('./src/config/config'); // Renomeado para evitar conflito com a variável 'config'
const path = require('path');
dotenv.config(); // Carrega variáveis de .env para process.env

const app = express();

// Middlewares
// Configuração de CORS
// PARA LIBERAR PARA QUALQUER ENDEREÇO:
app.use(cors()); // Isso permite TODAS as origens ('*') por padrão.
                 // ATENÇÃO: Para produção, é mais seguro especificar as origens permitidas.

// Configuração anterior (com origem específica, mantida comentada para referência):
/*
app.use(cors({
  origin: 'http://localhost:5175', // Permite requisições desta origem específica
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // Métodos permitidos
  allowedHeaders: ['Content-Type', 'Authorization'], // Cabeçalhos permitidos
  credentials: true // Se você for usar cookies ou sessões baseadas em cabeçalhos de autorização
}));
*/

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

// <<< ADICIONAR PARA SERVIR ARQUIVOS ESTÁTICOS >>>
// Isso tornará os arquivos dentro da pasta 'public' acessíveis via URL
// Ex: se você salvar uma imagem em 'public/uploads/images/nome-da-imagem.jpg',
// ela estará acessível em 'http://localhost:3001/uploads/images/nome-da-imagem.jpg'
// O '/static' é opcional, se omitido, o caminho seria direto: '/uploads/images/...'
// Usarei '/static' para deixar claro que são arquivos estáticos, mas você pode remover se preferir.
// app.use('/static', express.static(path.join(__dirname, 'public')));
// VOU OPTAR POR NÃO USAR /static no prefixo da URL para simplificar a URL final da imagem
app.use(express.static(path.join(__dirname, 'public'))); // Ex: http://localhost:3001/uploads/images/nome.jpg

// Rotas
app.use('/', allRoutes); // Monta todas as rotas da API

// Rota de Teste
app.get('/', (req, res) => {
  res.send('Servidor do Blog Famosos na Mídia está no ar!');
});

// Middleware de Tratamento de Erros Genérico
app.use((err, req, res, next) => {
  console.error("ERRO NÃO TRATADO:", err.stack);
  if (err.name === 'MulterError') { // Tratamento específico para erros do Multer
    return res.status(400).json({ message: `Erro de upload: ${err.message}. Código: ${err.code}` });
  }
  res.status(500).json({ message: 'Ocorreu um erro inesperado no servidor.' });
});

const syncDatabase = async () => {
  try {
    await db.sequelize.sync();
    console.log('Banco de dados sincronizado com sucesso.');
  } catch (error) {
    console.error('Erro ao sincronizar o banco de dados:', error);
  }
};

syncDatabase();

const PORT = configModule.port || 3001;
app.listen(PORT, async () => {
  console.log(`Servidor rodando na porta ${PORT} no ambiente ${configModule.nodeEnv}`);
  await syncDatabase();
});

module.exports = app;


