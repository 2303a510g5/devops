-- ============================================================
-- MediCore Hospital Management System
-- Database Schema + Seed Data
-- Run this file ONCE to set up the database
-- ============================================================

CREATE DATABASE IF NOT EXISTS hospital_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hospital_db;

-- ============================================================
-- TABLE: admins
-- ============================================================
CREATE TABLE IF NOT EXISTS admins (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100)  NOT NULL,
    email       VARCHAR(150)  UNIQUE NOT NULL,
    password    VARCHAR(255)  NOT NULL,
    phone       VARCHAR(20),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE: doctors
-- ============================================================
CREATE TABLE IF NOT EXISTS doctors (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    name                VARCHAR(100)  NOT NULL,
    email               VARCHAR(150)  UNIQUE NOT NULL,
    password            VARCHAR(255)  NOT NULL,
    phone               VARCHAR(20),
    specialization      VARCHAR(100)  NOT NULL,
    qualification       VARCHAR(200),
    experience_years    INT DEFAULT 0,
    consultation_fee    DECIMAL(10,2) DEFAULT 0.00,
    available_from      TIME DEFAULT '09:00:00',
    available_until     TIME DEFAULT '17:00:00',
    status              ENUM('active','inactive') DEFAULT 'active',
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE: patients
-- ============================================================
CREATE TABLE IF NOT EXISTS patients (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(100)  NOT NULL,
    email           VARCHAR(150)  UNIQUE NOT NULL,
    password        VARCHAR(255)  NOT NULL,
    phone           VARCHAR(20),
    date_of_birth   DATE,
    gender          ENUM('Male','Female','Other'),
    blood_group     VARCHAR(5),
    address         TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE: appointments
-- ============================================================
CREATE TABLE IF NOT EXISTS appointments (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    patient_id          INT NOT NULL,
    doctor_id           INT NOT NULL,
    appointment_date    DATE NOT NULL,
    appointment_time    TIME NOT NULL,
    reason              TEXT,
    status              ENUM('pending','confirmed','completed','cancelled') DEFAULT 'pending',
    notes               TEXT,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id)  REFERENCES doctors(id)  ON DELETE CASCADE
);

-- ============================================================
-- TABLE: prescriptions
-- ============================================================
CREATE TABLE IF NOT EXISTS prescriptions (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id  INT NOT NULL,
    patient_id      INT NOT NULL,
    doctor_id       INT NOT NULL,
    diagnosis       TEXT NOT NULL,
    medications     JSON,
    instructions    TEXT,
    follow_up_date  DATE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id)     REFERENCES patients(id)     ON DELETE CASCADE,
    FOREIGN KEY (doctor_id)      REFERENCES doctors(id)      ON DELETE CASCADE
);

-- ============================================================
-- TABLE: billing
-- ============================================================
CREATE TABLE IF NOT EXISTS billing (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id      INT NOT NULL,
    patient_id          INT NOT NULL,
    doctor_id           INT NOT NULL,
    consultation_fee    DECIMAL(10,2) DEFAULT 0.00,
    medicine_cost       DECIMAL(10,2) DEFAULT 0.00,
    total_amount        DECIMAL(10,2) DEFAULT 0.00,
    payment_status      ENUM('pending','paid','cancelled') DEFAULT 'pending',
    payment_method      ENUM('cash','card','upi','insurance') DEFAULT 'cash',
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id)     REFERENCES patients(id)     ON DELETE CASCADE,
    FOREIGN KEY (doctor_id)      REFERENCES doctors(id)      ON DELETE CASCADE
);

-- ============================================================
-- SEED DATA
-- Passwords are plain text here for demo purposes.
-- In production use bcrypt hashes.
-- ============================================================

-- Admin (password: Admin@123)
INSERT INTO admins (name, email, password, phone) VALUES
('Super Admin', 'admin@hospital.com', 'Admin@123', '+91-9000000001');

-- Doctors (password: Doctor@123)
INSERT INTO doctors (name, email, password, phone, specialization, qualification, experience_years, consultation_fee) VALUES
('Dr. Priya Sharma',  'priya.sharma@hospital.com',  'Doctor@123', '+91-9000000002', 'Cardiologist', 'MBBS, MD (Cardiology)', 12, 800.00),
('Dr. Rahul Verma',   'rahul.verma@hospital.com',   'Doctor@123', '+91-9000000003', 'Orthopedics',  'MBBS, MS (Ortho)',      8,  600.00),
('Dr. Anjali Patel',  'anjali.patel@hospital.com',  'Doctor@123', '+91-9000000004', 'Pediatrics',   'MBBS, DCH',             10, 500.00),
('Dr. Suresh Kumar',  'suresh.kumar@hospital.com',  'Doctor@123', '+91-9000000005', 'Neurology',    'MBBS, DM (Neurology)',  15, 1000.00);

-- Patients (password: Patient@123)
INSERT INTO patients (name, email, password, phone, date_of_birth, gender, blood_group, address) VALUES
('Amit Singh',  'amit.singh@email.com',  'Patient@123', '+91-9111111001', '1990-05-15', 'Male',   'O+', 'Hyderabad, Telangana'),
('Sneha Reddy', 'sneha.reddy@email.com', 'Patient@123', '+91-9111111002', '1995-08-22', 'Female', 'A+', 'Bangalore, Karnataka'),
('Vikram Nair', 'vikram.nair@email.com', 'Patient@123', '+91-9111111003', '1985-03-10', 'Male',   'B+', 'Chennai, Tamil Nadu');

-- Sample Appointments
INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, reason, status) VALUES
(1, 1, DATE_ADD(CURDATE(), INTERVAL 3 DAY),  '10:00:00', 'Chest pain and shortness of breath', 'confirmed'),
(2, 3, DATE_ADD(CURDATE(), INTERVAL 1 DAY),  '11:00:00', 'Child routine checkup',               'pending'),
(3, 2, DATE_SUB(CURDATE(), INTERVAL 2 DAY),  '14:00:00', 'Knee pain after fall',                'completed'),
(1, 4, DATE_ADD(CURDATE(), INTERVAL 6 DAY),  '09:00:00', 'Recurring headaches',                 'confirmed');

-- Sample Billing
INSERT INTO billing (appointment_id, patient_id, doctor_id, consultation_fee, medicine_cost, total_amount, payment_status) VALUES
(3, 3, 2, 600.00, 250.00, 850.00, 'paid');

-- Sample Prescription
INSERT INTO prescriptions (appointment_id, patient_id, doctor_id, diagnosis, medications, instructions) VALUES
(3, 3, 2, 'Grade 1 Knee Sprain',
 '[{"name":"Ibuprofen 400mg","dosage":"1 tablet","frequency":"Twice daily","duration":"5 days"},{"name":"Diclofenac Gel","dosage":"Apply locally","frequency":"3x daily","duration":"7 days"}]',
 'Rest for 1 week. Apply ice pack every 4 hours. Avoid strenuous activity.');

SELECT 'Database setup complete!' AS Status;
