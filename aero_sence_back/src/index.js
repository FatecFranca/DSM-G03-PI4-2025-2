import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/index.js';

dotenv.config();
const app = express();

const allowedOrigins = [
  'http://172.203.135.173',
  'http://172.203.135.173:5173'
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

app.use(express.json());

app.use('/api', apiRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor back-end rodando na porta ${PORT}`);
});
