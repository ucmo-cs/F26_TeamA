CREATE DATABASE IF NOT EXISTS loan_tracker_db;
USE loan_tracker_db;

-- 1. Users Table (Handles authentication for Admin & Customer)
CREATE TABLE users (
                       user_id INT AUTO_INCREMENT PRIMARY KEY,
                       email VARCHAR(255) NOT NULL UNIQUE,
                       password VARCHAR(255) NOT NULL, -- Plaintext per spec rules
                       role ENUM('ADMIN', 'CUSTOMER') NOT NULL DEFAULT 'CUSTOMER',
                       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Customer Profiles Table
CREATE TABLE customer_profiles (
                                   customer_id INT AUTO_INCREMENT PRIMARY KEY,
                                   user_id INT NOT NULL UNIQUE,
                                   full_name VARCHAR(255) NOT NULL,
                                   phone_number VARCHAR(50),
                                   FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 3. Loans Table
CREATE TABLE loans (
                       loan_id INT AUTO_INCREMENT PRIMARY KEY,
                       customer_id INT NOT NULL,
                       original_amount DECIMAL(12, 2) NOT NULL,
                       remaining_balance DECIMAL(12, 2) NOT NULL,
                       interest_rate DECIMAL(5, 2) NOT NULL, -- e.g., 5.50 for 5.5%
                       date_issued DATE NOT NULL,
                       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                       FOREIGN KEY (customer_id) REFERENCES customer_profiles(customer_id) ON DELETE CASCADE
);

-- 4. Customer Bank Details Table (for auto-payments)
CREATE TABLE bank_details (
                              bank_detail_id INT AUTO_INCREMENT PRIMARY KEY,
                              customer_id INT NOT NULL UNIQUE,
                              bank_name VARCHAR(100) NOT NULL,
                              account_number VARCHAR(100) NOT NULL,
                              routing_number VARCHAR(100) NOT NULL,
                              FOREIGN KEY (customer_id) REFERENCES customer_profiles(customer_id) ON DELETE CASCADE
);

-- 5. Payment Schedules Table
CREATE TABLE payment_schedules (
                                   schedule_id INT AUTO_INCREMENT PRIMARY KEY,
                                   loan_id INT NOT NULL UNIQUE,
                                   frequency ENUM('WEEKLY', 'BI_WEEKLY', 'MONTHLY') NOT NULL,
                                   payment_amount DECIMAL(12, 2) NOT NULL,
                                   day_of_week VARCHAR(15),  -- Used for Weekly / Bi-Weekly (e.g., "Monday")
                                   day_of_month INT,          -- Used for Monthly (1-31)
                                   next_payment_date DATE NOT NULL,
                                   FOREIGN KEY (loan_id) REFERENCES loans(loan_id) ON DELETE CASCADE
);