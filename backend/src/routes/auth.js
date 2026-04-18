const express = require('express');
const router  = express.Router();
const { query } = require('../config/db');
const { makeToken, auth } = require('../middleware/auth');

// ── POST /api/auth/login ──────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password || !role)
      return res.status(400).json({ success: false, message: 'Email, password and role are required' });

    const tableMap = { admin: 'admins', doctor: 'doctors', patient: 'patients' };
    const table = tableMap[role];
    if (!table) return res.status(400).json({ success: false, message: 'Invalid role' });

    const rows = await query(`SELECT * FROM ${table} WHERE email = ?`, [email]);
    if (!rows.length) return res.status(401).json({ success: false, message: 'No account found with that email' });

    const user = rows[0];
    // Plain text compare (for demo). Use bcrypt in production.
    if (user.password !== password)
      return res.status(401).json({ success: false, message: 'Incorrect password' });

    const { password: _p, ...safeUser } = user;
    const token = makeToken({ id: user.id, role, email: user.email, name: user.name, spec: user.specialization || '' });

    res.json({ success: true, message: 'Login successful', token, user: { ...safeUser, role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── POST /api/auth/register  (patients only) ─────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, date_of_birth, gender, blood_group, address } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'Name, email and password required' });

    const exists = await query('SELECT id FROM patients WHERE email = ?', [email]);
    if (exists.length) return res.status(409).json({ success: false, message: 'Email already registered' });

    const result = await query(
      'INSERT INTO patients (name,email,password,phone,date_of_birth,gender,blood_group,address) VALUES (?,?,?,?,?,?,?,?)',
      [name, email, password, phone || null, date_of_birth || null, gender || null, blood_group || null, address || null]
    );
    const token = makeToken({ id: result.insertId, role: 'patient', email, name });
    res.status(201).json({ success: true, message: 'Account created', token, user: { id: result.insertId, name, email, role: 'patient' } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── POST /api/auth/register-doctor  (admin creates doctors) ──
router.post('/register-doctor', async (req, res) => {
  try {
    const { name, email, password, phone, specialization, qualification, experience_years, consultation_fee } = req.body;
    if (!name || !email || !password || !specialization)
      return res.status(400).json({ success: false, message: 'Required fields missing' });

    const exists = await query('SELECT id FROM doctors WHERE email = ?', [email]);
    if (exists.length) return res.status(409).json({ success: false, message: 'Email already registered' });

    const result = await query(
      'INSERT INTO doctors (name,email,password,phone,specialization,qualification,experience_years,consultation_fee) VALUES (?,?,?,?,?,?,?,?)',
      [name, email, password, phone || null, specialization, qualification || null, experience_years || 0, consultation_fee || 500]
    );
    res.status(201).json({ success: true, message: 'Doctor account created', id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── POST /api/auth/register-admin  (secret key required) ─────
router.post('/register-admin', async (req, res) => {
  try {
    const { name, email, password, phone, secretKey } = req.body;
    if (secretKey !== 'HMS@AdminKey2026')
      return res.status(403).json({ success: false, message: 'Invalid admin secret key' });
    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'Required fields missing' });

    const exists = await query('SELECT id FROM admins WHERE email = ?', [email]);
    if (exists.length) return res.status(409).json({ success: false, message: 'Email already registered' });

    const result = await query(
      'INSERT INTO admins (name,email,password,phone) VALUES (?,?,?,?)',
      [name, email, password, phone || null]
    );
    res.status(201).json({ success: true, message: 'Admin account created', id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── GET /api/auth/me ─────────────────────────────────────────
router.get('/me', auth, async (req, res) => {
  try {
    const { id, role } = req.user;
    const tableMap = { admin: 'admins', doctor: 'doctors', patient: 'patients' };
    const rows = await query(`SELECT * FROM ${tableMap[role]} WHERE id = ?`, [id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'User not found' });
    const { password: _p, ...safeUser } = rows[0];
    res.json({ success: true, user: { ...safeUser, role } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
