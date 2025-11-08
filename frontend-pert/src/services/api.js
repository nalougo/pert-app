import axios from 'axios';

const API_URL = 'http://localhost:8000/api'; // URL de votre Laravel

export const generatePertDiagram = async (tasks, t0) => {
  const response = await axios.post(`${API_URL}/pert/calculate`, {
    tasks,
    t0
  });
  return response.data;
};