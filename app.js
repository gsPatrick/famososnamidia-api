// src/app.js (no backend)
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const allRoutes = require('./routes/index.routes'); // Ajuste o caminho se sua pasta src estiver em outro nível (parece correto)
// const db = require('./models'); // Ajuste o caminho (importado apenas em server.js agora)
const configModule = require('./config/config'); // Renomeado para evitar conflito com a variável 'config'
const path = require('path');

// Carrega variáveis de .env para process.env - Deve ser feito ANTES de carregar módulos que dependem delas
dotenv.config(); 

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
app.use(express.static(path.join(__dirname, '..', 'public'))); // <<< Ajuste de caminho relativo

// Rotas
app.use('/api/v1', allRoutes); // Monta todas as rotas da API sob '/api/v1' - Ajustado para usar o prefixo em um lugar central

// Rota de Teste (mantida como exemplo, pode ser removida se não precisar)
app.get('/', (req, res) => {
  res.send('Servidor do Blog Famosos na Mídia está no ar!');
});

// Middleware de Tratamento de Erros Genérico
app.use((err, req, res, next) => {
  console.error("ERRO NÃO TRATADO:", err.stack);
  
  // Tratamento de erros específicos do Multer
  if (err.name === 'MulterError') { 
    return res.status(400).json({ message: `Erro de upload: ${err.message}. Código: ${err.code}` });
  }
  
  // Inclui validações SequelizeErrors (mais detalhado)
  if (err.name === 'SequelizeValidationError') {
      const messages = err.errors.map(e => e.message).join(', ');
      return res.status(400).json({ message: `Erro de validação: ${messages}` });
  }
   if (err.name === 'SequelizeUniqueConstraintError') {
       const messages = err.errors.map(e => `${e.path}: ${e.message}`).join(', '); // Inclui o campo do erro
       return res.status(400).json({ message: `Erro de duplicidade: ${messages}` });
   }
   if (err.name === 'SequelizeForeignKeyConstraintError') {
        // Tenta extrair detalhes do erro original do DB se disponível
        const detail = err.parent && err.parent.detail ? err.parent.detail : err.message;
        return res.status(400).json({ message: `Erro de chave estrangeira: ${detail}` });
   }
   if (err.message && err.message.includes('não encontrado')) {
        return res.status(404).json({ message: err.message });
   }
    if (err.message && err.message.includes('Não autorizado') || err.message.includes('negado')) {
        return res.status(403).json({ message: err.message });
   }
    if (err.message && err.message.includes('Email ou senha inválidos')) {
        return res.status(401).json({ message: err.message });
    }


  // Resposta genérica para outros erros não tratados
  res.status(500).json({ message: 'Ocorreu um erro inesperado no servidor.' });
});


// <<< REMOVER CHAMADAS DE syncDatabase() E app.listen() AQUI >>>
// Estas foram movidas para server.js, que é o ponto de entrada.
// Apenas configuramos o aplicativo Express e o exportamos.

module.exports = app;