const express = require('express');
const router  = express.Router();
const { query } = require('../config/db');
const { auth, role } = require('../middleware/auth');

// GET /api/appointments — filtered by role
router.get('/', auth, async (req, res) => {
  try {
    const { id, role: userRole } = req.user;
    let sql = `SELECT a.*, p.name AS patient_name, d.name AS doctor_name, d.specialization
               FROM appointments a
               JOIN patients p ON a.patient_id=p.id
               JOIN doctors  d ON a.doctor_id=d.id`;
    const params = [];
    if (userRole === 'patient') { sql += ' WHERE a.patient_id=?'; params.push(id); }
    if (userRole === 'doctor')  { sql += ' WHERE a.doctor_id=?';  params.push(id); }
    sql += ' ORDER BY a.appointment_date DESC, a.appointment_time DESC';
    const rows = await query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/appointments/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const rows = await query(
      `SELECT a.*, p.name AS patient_name, p.phone AS patient_phone, p.blood_group,
              d.name AS doctor_name, d.specialization, d.phone AS doctor_phone
       FROM appointments a
       JOIN patients p ON a.patient_id=p.id
       JOIN doctors  d ON a.doctor_id=d.id
       WHERE a.id=?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Appointment not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/appointments — patient books
router.post('/', auth, role('patient', 'admin'), async (req, res) => {
  try {
    const { doctor_id, appointment_date, appointment_time, reason } = req.body;
    const patient_id = req.user.role === 'patient' ? req.user.id : req.body.patient_id;
    if (!doctor_id || !appointment_date || !appointment_time)
      return res.status(400).json({ success: false, message: 'doctor_id, appointment_date, appointment_time are required' });

    // Check slot conflict
    const conflict = await query(
      `SELECT id FROM appointments WHERE doctor_id=? AND appointment_date=? AND appointment_time=? AND status NOT IN ('cancelled')`,
      [doctor_id, appointment_date, appointment_time]
    );
    if (conflict.length)
      return res.status(409).json({ success: false, message: 'That time slot is already booked. Please choose another.' });

    // Get doctor fee
    const [doctor] = await query('SELECT consultation_fee FROM doctors WHERE id=?', [doctor_id]);
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });

    const result = await query(
      'INSERT INTO appointments (patient_id,doctor_id,appointment_date,appointment_time,reason,status) VALUES (?,?,?,?,?,?)',
      [patient_id, doctor_id, appointment_date, appointment_time, reason || null, 'confirmed']
    );
    const apptId = result.insertId;

    // Auto-create billing record
    await query(
      'INSERT INTO billing (appointment_id,patient_id,doctor_id,consultation_fee,total_amount) VALUES (?,?,?,?,?)',
      [apptId, patient_id, doctor_id, doctor.consultation_fee, doctor.consultation_fee]
    );

    res.status(201).json({ success: true, message: 'Appointment booked successfully', id: apptId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/appointments/:id/status — update status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status, notes } = req.body;
    const allowed = ['pending','confirmed','completed','cancelled'];
    if (!allowed.includes(status))
      return res.status(400).json({ success: false, message: 'Invalid status' });

    await query('UPDATE appointments SET status=?, notes=? WHERE id=?', [status, notes || null, req.params.id]);
    res.json({ success: true, message: 'Appointment updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/appointments/:id — cancel
router.delete('/:id', auth, async (req, res) => {
  try {
    await query('UPDATE appointments SET status=? WHERE id=?', ['cancelled', req.params.id]);
    res.json({ success: true, message: 'Appointment cancelled' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
