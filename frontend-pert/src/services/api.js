import axios from 'axios';


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