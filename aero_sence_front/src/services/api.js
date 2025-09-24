// aero_sence_front/src/services/api.js
import axios from 'axios';

const api = axios.create({
  // A URL base do seu back-end. Ajuste se for diferente.
  baseURL: 'http://localhost:3000/api', 
});

export default api;