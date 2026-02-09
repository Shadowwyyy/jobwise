import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// resumes
export const uploadResume = async (file) => {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post('/resumes/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const getResumes = async () => {
  const { data } = await api.get('/resumes/');
  return data;
};

export const getResume = async (id) => {
  const { data } = await api.get(`/resumes/${id}`);
  return data;
};

// jobs
export const createJD = async (payload) => {
  const { data } = await api.post('/jobs/', payload);
  return data;
};

export const getJDs = async () => {
  const { data } = await api.get('/jobs/');
  return data;
};

// generation
export const runMatch = async (payload) => {
  const { data } = await api.post('/generate/match', payload);
  return data;
};

export const runCoverLetter = async (payload) => {
  const { data } = await api.post('/generate/cover-letter', payload);
  return data;
};

export const runInterviewPrep = async (payload) => {
  const { data } = await api.post('/generate/interview-prep', payload);
  return data;
};

export default api;