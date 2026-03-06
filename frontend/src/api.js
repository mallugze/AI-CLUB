import axios from 'axios';

const API = axios.create({ baseURL: 'https://ai-club-backend-8xdp.onrender.com/api' });

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authAPI = {
  login: (email, password) => API.post('/auth/login', { email, password }),
  register: (name, email, password) => API.post('/auth/register', { name, email, password }),
};

export const teamsAPI = {
  getByEvent: (eventId) => API.get(`/events/${eventId}/teams`),
  create: (eventId, data) => API.post(`/events/${eventId}/teams`, data),
  update: (id, data) => API.put(`/teams/${id}`, data),
  delete: (id) => API.delete(`/teams/${id}`),
};

export const scoresAPI = {
  assign: (data) => API.post('/scores', data),
  bulk: (scores) => API.post('/scores/bulk', { scores }),
};

export const eventsAPI = {
  getAll: () => API.get('/events'),
  create: (data) => API.post('/events', data),
  update: (id, data) => API.put(`/events/${id}`, data),
  delete: (id) => API.delete(`/events/${id}`),
  summary: (id) => API.get(`/events/${id}/summary`),
  exportCSV: (id) => `https://ai-club-backend-8xdp.onrender.com/api/events/${id}/export`,
};

export const leaderboardAPI = {
  event: (eventId) => API.get(`/leaderboard/event/${eventId}`),
  overall: () => API.get('/leaderboard/overall'),
  teamHistory: (teamId) => API.get(`/leaderboard/team-history/${teamId}`),
};

export const usersAPI = {
  getAll: () => API.get('/users'),
  updateRole: (id, role) => API.put(`/users/${id}/role`, { role }),
  deleteUser: (id) => API.delete(`/users/${id}`),
};

export const activitiesAPI = {
  getAll: () => API.get('/activities'),
  create: (data) => API.post('/activities', data),
  update: (id, data) => API.put(`/activities/${id}`, data),
  delete: (id) => API.delete(`/activities/${id}`),
  book: (id) => API.post(`/activities/${id}/book`),
  cancelBook: (id) => API.delete(`/activities/${id}/book`),
  getBookings: (id) => API.get(`/activities/${id}/bookings`),
};

export const announcementsAPI = {
  getAll: () => API.get('/announcements'),
  create: (data) => API.post('/announcements', data),
  delete: (id) => API.delete(`/announcements/${id}`),
};

export const profileAPI = {
  get: (userId) => API.get(`/profile/${userId}`),
};

export const certificatesAPI = {
  issue: (teamId, eventId, userId, userName) => API.post('/certificates/issue', { teamId, eventId, userId, userName }),
  verify: (certId) => axios.get(`https://ai-club-backend-8xdp.onrender.com/api/certificates/verify/${certId}`),
  getQR: (certId) => API.get(`/certificates/qr/${certId}`),
};

export default API;