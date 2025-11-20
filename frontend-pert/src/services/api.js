import axios from 'axios';

// URL de l'API Laravel - utilise la variable d'environnement VITE_API_URL
// En production sur Vercel, cette variable doit être définie avec l'URL de votre backend Render
const API_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api` 
  : 'http://localhost:8000/api';

export const generatePertDiagram = async (tasks, t0) => {
  const response = await axios.post(`${API_URL}/pert/calculate`, {
    tasks,
    t0
  });
  return response.data;
};