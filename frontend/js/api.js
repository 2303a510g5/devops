// ── API Configuration ─────────────────────────────────────────
const API = 'http://localhost:5000/api';

// ── Token helpers ─────────────────────────────────────────────
const token  = {
  get:    ()  => localStorage.getItem('hms_token'),
  set:    (t) => localStorage.setItem('hms_token', t),
  clear:  ()  => localStorage.removeItem('hms_token'),
};
const session = {
  get:   ()  => JSON.parse(localStorage.getItem('hms_user') || 'null'),
  set:   (u) => localStorage.setItem('hms_user', JSON.stringify(u)),
  clear: ()  => localStorage.removeItem('hms_user'),
};

// ── Core fetch ────────────────────────────────────────────────
async function api(method, path, body = null) {
  const headers = { 'Content-Type': 'application/json' };
  const t = token.get();
  if (t) headers['Authorization'] = 'Bearer ' + t;

  const res = await fetch(API + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

const get    = (path)        => api('GET',    path);
const post   = (path, body)  => api('POST',   path, body);
const put    = (path, body)  => api('PUT',    path, body);
const patch  = (path, body)  => api('PATCH',  path, body);
const del    = (path)        => api('DELETE', path);

// ── Auth ──────────────────────────────────────────────────────
const Auth = {
  login:           (body) => post('/auth/login', body),
  register:        (body) => post('/auth/register', body),
  registerDoctor:  (body) => post('/auth/register-doctor', body),
  registerAdmin:   (body) => post('/auth/register-admin', body),
  me:              ()     => get('/auth/me'),
};

// ── Doctors ───────────────────────────────────────────────────
const Doctors = {
  list:         ()     => get('/doctors'),
  get:          (id)   => get('/doctors/' + id),
  appointments: (id)   => get('/doctors/' + id + '/appointments'),
  update:       (id,b) => put('/doctors/' + id, b),
};

// ── Patients ──────────────────────────────────────────────────
const Patients = {
  list:          ()    => get('/patients'),
  get:           (id)  => get('/patients/' + id),
  update:        (id,b)=> put('/patients/' + id, b),
  appointments:  (id)  => get('/patients/' + id + '/appointments'),
  prescriptions: (id)  => get('/patients/' + id + '/prescriptions'),
  billing:       (id)  => get('/patients/' + id + '/billing'),
};

// ── Appointments ──────────────────────────────────────────────
const Appointments = {
  list:         ()    => get('/appointments'),
  get:          (id)  => get('/appointments/' + id),
  book:         (b)   => post('/appointments', b),
  status:       (id,b)=> patch('/appointments/' + id + '/status', b),
  cancel:       (id)  => del('/appointments/' + id),
};

// ── Prescriptions ─────────────────────────────────────────────
const Prescriptions = {
  create: (b)  => post('/prescriptions', b),
  get:    (id) => get('/prescriptions/' + id),
};

// ── Admin ─────────────────────────────────────────────────────
const Admin = {
  dashboard:    ()    => get('/admin/dashboard'),
  billing:      ()    => get('/admin/billing'),
  updateBilling:(id,b)=> put('/admin/billing/' + id, b),
  prescriptions:()    => get('/admin/prescriptions'),
};

// ── Helpers ───────────────────────────────────────────────────
function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
function formatCurrency(n) {
  return '₹' + parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
}
function badge(status) {
  const cls = { pending:'badge-pending', confirmed:'badge-confirmed', completed:'badge-completed', cancelled:'badge-cancelled', paid:'badge-paid', active:'badge-active' };
  return `<span class="badge ${cls[status] || 'badge-pending'}">${status}</span>`;
}
function logout() {
  token.clear(); session.clear();
  window.location.href = '../index.html';
}
function requireAuth(expectedRole) {
  const user = session.get();
  const tok  = token.get();
  if (!user || !tok) { window.location.href = '../index.html'; return null; }
  if (expectedRole && user.role !== expectedRole) { window.location.href = '../index.html'; return null; }
  return user;
}
function showToast(msg, type = 'success') {
  let t = document.getElementById('globalToast');
  if (!t) { t = document.createElement('div'); t.id = 'globalToast'; document.body.appendChild(t); }
  t.className = 'toast toast-' + type;
  t.textContent = msg;
  t.style.display = 'flex';
  setTimeout(() => { t.style.display = 'none'; }, 3500);
}
function showError(elId, msg) {
  const el = document.getElementById(elId);
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}
function hideError(elId) {
  const el = document.getElementById(elId);
  if (el) el.style.display = 'none';
}

window.API_BASE = API;
window.token    = token;
window.session  = session;
window.Auth     = Auth;
window.Doctors  = Doctors;
window.Patients = Patients;
window.Appointments = Appointments;
window.Prescriptions = Prescriptions;
window.Admin    = Admin;
window.formatDate     = formatDate;
window.formatCurrency = formatCurrency;
window.badge    = badge;
window.logout   = logout;
window.requireAuth = requireAuth;
window.showToast   = showToast;
window.showError   = showError;
window.hideError   = hideError;
