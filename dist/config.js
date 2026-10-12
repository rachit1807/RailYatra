// Set this to the deployed API origin to use shared server-side accounts and bookings.
// Local full-stack development automatically connects to the API served on port 5173.
const localFullStack = (['localhost', '127.0.0.1'].includes(location.hostname) && location.port === '5173') || location.hostname.endsWith('.onrender.com');
window.RY_API_BASE = window.RY_API_BASE || (localFullStack ? location.origin : 'https://railyatra-api.onrender.com');
