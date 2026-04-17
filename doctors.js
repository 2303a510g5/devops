const express = require('express');
const router  = express.Router();
const { query } = require('../config/db');
const { auth, role } = require('../middleware/auth');

// GET /api/doctors — public list
router.get('/', async (req, res) => {
  try {
    const doctors = await query(
      'SELECT id,name,email,phone,specialization,qualification,experience_years,consultation_fee,available_from,available_until,status FROM doctors WHERE status=?',
      ['active']
    );
    res.json({ success: true, data: doctors });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/doctors/:id
router.get('/:id', async (req, res) => {
  try {
    const rows = await query(
      'SELECT id,name,email,phone,specialization,qualification,experience_years,consultation_fee,available_from,available_until,status FROM doctors WHERE id=?',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Doctor not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/doctors/:id/appointments — doctor sees own, admin sees all
router.get('/:id/appointments', auth, async (req, res) => {
  try {
    const { id, role: userRole } = req.user;
    const doctorId = req.params.id;
    if (userRole === 'doctor' && id !== parseInt(doctorId))
      return res.status(403).json({ success: false, message: 'Access denied' });

    const rows = await query(
      `SELECT a.*, p.name AS patient_name, p.phone AS patient_phone, p.blood_group
       FROM appointments a JOIN patients p ON a.patient_id=p.id
       WHERE a.doctor_id=? ORDER BY a.appointment_date ASC, a.appointment_time ASC`,
      [doctorId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/doctors/:id — update own profile
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, phone, specialization, qualification, experience_years, consultation_fee } = req.body;
    await query(
      'UPDATE doctors SET name=?,phone=?,specialization=?,qualification=?,experience_years=?,consultation_fee=? WHERE id=?',
      [name, phone, specialization, qualification, experience_years, consultation_fee, req.params.id]
    );
    res.json({ success: true, message: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/doctors/:id — admin only
router.delete('/:id', auth, role('admin'), async (req, res) => {
  try {
    await query('UPDATE doctors SET status=? WHERE id=?', ['inactive', req.params.id]);
    res.json({ success: true, message: 'Doctor deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
