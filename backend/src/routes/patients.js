const express = require('express');
const router  = express.Router();
const { query } = require('../config/db');
const { auth, role } = require('../middleware/auth');

// GET /api/patients — admin only
router.get('/', auth, role('admin'), async (req, res) => {
  try {
    const rows = await query(
      'SELECT id,name,email,phone,date_of_birth,gender,blood_group,address,created_at FROM patients ORDER BY created_at DESC'
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/patients/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const { id: userId, role: userRole } = req.user;
    if (userRole === 'patient' && userId !== parseInt(req.params.id))
      return res.status(403).json({ success: false, message: 'Access denied' });

    const rows = await query(
      'SELECT id,name,email,phone,date_of_birth,gender,blood_group,address,created_at FROM patients WHERE id=?',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Patient not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/patients/:id — patient updates own profile
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, phone, date_of_birth, gender, blood_group, address } = req.body;
    await query(
      'UPDATE patients SET name=?,phone=?,date_of_birth=?,gender=?,blood_group=?,address=? WHERE id=?',
      [name, phone, date_of_birth, gender, blood_group, address, req.params.id]
    );
    res.json({ success: true, message: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/patients/:id/appointments
router.get('/:id/appointments', auth, async (req, res) => {
  try {
    const { id: userId, role: userRole } = req.user;
    if (userRole === 'patient' && userId !== parseInt(req.params.id))
      return res.status(403).json({ success: false, message: 'Access denied' });

    const rows = await query(
      `SELECT a.*, d.name AS doctor_name, d.specialization
       FROM appointments a JOIN doctors d ON a.doctor_id=d.id
       WHERE a.patient_id=? ORDER BY a.appointment_date DESC`,
      [req.params.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/patients/:id/prescriptions
router.get('/:id/prescriptions', auth, async (req, res) => {
  try {
    const { id: userId, role: userRole } = req.user;
    if (userRole === 'patient' && userId !== parseInt(req.params.id))
      return res.status(403).json({ success: false, message: 'Access denied' });

    const rows = await query(
      `SELECT p.*, d.name AS doctor_name, d.specialization, a.appointment_date
       FROM prescriptions p
       JOIN doctors d ON p.doctor_id=d.id
       JOIN appointments a ON p.appointment_id=a.id
       WHERE p.patient_id=? ORDER BY p.created_at DESC`,
      [req.params.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/patients/:id/billing
router.get('/:id/billing', auth, async (req, res) => {
  try {
    const { id: userId, role: userRole } = req.user;
    if (userRole === 'patient' && userId !== parseInt(req.params.id))
      return res.status(403).json({ success: false, message: 'Access denied' });

    const rows = await query(
      `SELECT b.*, d.name AS doctor_name, a.appointment_date
       FROM billing b
       JOIN doctors d ON b.doctor_id=d.id
       JOIN appointments a ON b.appointment_id=a.id
       WHERE b.patient_id=? ORDER BY b.created_at DESC`,
      [req.params.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
