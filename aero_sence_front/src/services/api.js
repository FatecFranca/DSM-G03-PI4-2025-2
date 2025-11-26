import axios from 'axios';

const api = axios.create({
  baseURL: 'http://172.203.135.173:3000/api', 
});

export default api;