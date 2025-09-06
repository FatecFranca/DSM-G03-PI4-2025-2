import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/test', async (req, res) => {
  try {
    const response = await axios.get('https://api.github.com');
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Erro na requisição externa' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
