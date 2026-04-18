const express = require('express');
const router  = express.Router();
const { query } = require('../config/db');
const { auth, role } = require('../middleware/auth');

// POST /api/prescriptions — doctor writes prescription
router.post('/', auth, role('doctor'), async (req, res) => {
  try {
    const { appointment_id, diagnosis, medications, instructions, follow_up_date } = req.body;
    if (!appointment_id || !diagnosis)
      return res.status(400).json({ success: false, message: 'appointment_id and diagnosis required' });

    const [appt] = await query('SELECT * FROM appointments WHERE id=? AND doctor_id=?', [appointment_id, req.user.id]);
    if (!appt) return res.status(404).json({ success: false, message: 'Appointment not found or not yours' });

    const result = await query(
      'INSERT INTO prescriptions (appointment_id,patient_id,doctor_id,diagnosis,medications,instructions,follow_up_date) VALUES (?,?,?,?,?,?,?)',
      [appointment_id, appt.patient_id, req.user.id, diagnosis, JSON.stringify(medications || []), instructions || null, follow_up_date || null]
    );
    // Mark appointment completed
    await query('UPDATE appointments SET status=? WHERE id=?', ['completed', appointment_id]);
    res.status(201).json({ success: true, message: 'Prescription saved', id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/prescriptions/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const rows = await query(
      `SELECT rx.*, d.name AS doctor_name, d.specialization, p.name AS patient_name, a.appointment_date
       FROM prescriptions rx JOIN doctors d ON rx.doctor_id=d.id JOIN patients p ON rx.patient_id=p.id
       JOIN appointments a ON rx.appointment_id=a.id WHERE rx.id=?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Prescription not found' });
    const rx = rows[0];
    if (typeof rx.medications === 'string') rx.medications = JSON.parse(rx.medications);
    res.json({ success: true, data: rx });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
