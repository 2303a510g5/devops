const express = require('express');
const router  = express.Router();
const { query } = require('../config/db');
const { auth, role } = require('../middleware/auth');

// All admin routes require admin role
router.use(auth, role('admin'));

// GET /api/admin/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const [[{ totalPatients }]] = [await query('SELECT COUNT(*) AS totalPatients FROM patients')];
    const [[{ totalDoctors  }]] = [await query('SELECT COUNT(*) AS totalDoctors  FROM doctors WHERE status="active"')];
    const [[{ totalAppts    }]] = [await query('SELECT COUNT(*) AS totalAppts    FROM appointments')];
    const [[{ revenue       }]] = [await query('SELECT COALESCE(SUM(total_amount),0) AS revenue FROM billing WHERE payment_status="paid"')];
    const [[{ pendingAppts  }]] = [await query('SELECT COUNT(*) AS pendingAppts FROM appointments WHERE status="pending"')];

    const recentAppts = await query(
      `SELECT a.*, p.name AS patient_name, d.name AS doctor_name
       FROM appointments a JOIN patients p ON a.patient_id=p.id JOIN doctors d ON a.doctor_id=d.id
       ORDER BY a.created_at DESC LIMIT 5`
    );
    const billing = await query(
      `SELECT b.*, p.name AS patient_name, d.name AS doctor_name
       FROM billing b JOIN patients p ON b.patient_id=p.id JOIN doctors d ON b.doctor_id=d.id
       ORDER BY b.created_at DESC LIMIT 5`
    );

    res.json({
      success: true,
      data: { totalPatients, totalDoctors, totalAppts, revenue, pendingAppts, recentAppts, billing }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/billing — all billing
router.get('/billing', async (req, res) => {
  try {
    const rows = await query(
      `SELECT b.*, p.name AS patient_name, d.name AS doctor_name, a.appointment_date
       FROM billing b JOIN patients p ON b.patient_id=p.id JOIN doctors d ON b.doctor_id=d.id
       JOIN appointments a ON b.appointment_id=a.id ORDER BY b.created_at DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/admin/billing/:id — update payment
router.put('/billing/:id', async (req, res) => {
  try {
    const { payment_status, payment_method, medicine_cost } = req.body;
    const rows = await query('SELECT consultation_fee FROM billing WHERE id=?', [req.params.id]);
    const total = (rows[0]?.consultation_fee || 0) + (medicine_cost || 0);
    await query(
      'UPDATE billing SET payment_status=?,payment_method=?,medicine_cost=?,total_amount=? WHERE id=?',
      [payment_status, payment_method || 'cash', medicine_cost || 0, total, req.params.id]
    );
    res.json({ success: true, message: 'Billing updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/prescriptions — all prescriptions
router.get('/prescriptions', async (req, res) => {
  try {
    const rows = await query(
      `SELECT rx.*, p.name AS patient_name, d.name AS doctor_name, a.appointment_date
       FROM prescriptions rx JOIN patients p ON rx.patient_id=p.id JOIN doctors d ON rx.doctor_id=d.id
       JOIN appointments a ON rx.appointment_id=a.id ORDER BY rx.created_at DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
