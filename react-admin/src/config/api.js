// Central API base URL.
// Set REACT_APP_API_URL in your Vercel environment variables to point at
// your deployed backend (e.g. https://coursecampass-api.onrender.com).
// Falls back to localhost for local development.
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default API_BASE;
