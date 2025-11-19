const express = require('express');
const cors = require('cors');
const { swaggerUi, specs } = require('./swagger');
const sensorRoutes = require('./routes/sensor');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');

const app = express();

// Configure CORS explicitly to allow the frontend dev origin and handle preflight OPTIONS
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Ensure preflight requests get handled with CORS headers
app.options('*', cors());
app.use(express.json());

// Dados de teste
const testUser = {
  id: '1',
  name: 'Ana Júlia Alves Mota',
  email: 'anajuliaalvesmota@gmail.com',
  password: '123456'
};

// Armazenar usuário de teste globalmente para usar nas rotas
app.locals.testUser = testUser;

// Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Rotas
app.use('/api', sensorRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  console.log(`Documentação Swagger: http://localhost:${PORT}/api-docs`);
  console.log(`\n--- Usuário de Teste ---`);
  console.log(`Email: ${testUser.email}`);
  console.log(`Senha: ${testUser.password}`);
});
