
-- Supabase Schema Migration Script for Gaji Kita Selaras
-- This file contains the complete database schema definition for Gaji Kita Selaras

-- Create departments table
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create positions table
CREATE TABLE positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  department_id UUID REFERENCES departments(id),
  salary_base NUMERIC(15, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create employees table
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nik TEXT UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT,
  email TEXT UNIQUE,
  phone TEXT,
  birth_date DATE,
  hire_date DATE NOT NULL,
  position_id UUID REFERENCES positions(id),
  tax_status TEXT DEFAULT 'TK/0', -- TK/0, K/0, K/1, etc.
  npwp TEXT,
  bpjs_kesehatan TEXT,
  bpjs_ketenagakerjaan TEXT,
  bank_name TEXT,
  bank_account TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create attendance table
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id),
  date DATE NOT NULL,
  check_in TIMESTAMP WITH TIME ZONE,
  check_out TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'present', -- present, absent, sick, leave, etc.
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(employee_id, date)
);

-- Create payroll table
CREATE TABLE payroll (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  basic_salary NUMERIC(15, 2) NOT NULL,
  allowances NUMERIC(15, 2) DEFAULT 0,
  overtime NUMERIC(15, 2) DEFAULT 0,
  deductions NUMERIC(15, 2) DEFAULT 0,
  pph21 NUMERIC(15, 2) DEFAULT 0,
  bpjs_kes_employee NUMERIC(15, 2) DEFAULT 0,
  bpjs_kes_company NUMERIC(15, 2) DEFAULT 0,
  bpjs_tk_jht_employee NUMERIC(15, 2) DEFAULT 0,
  bpjs_tk_jht_company NUMERIC(15, 2) DEFAULT 0,
  bpjs_tk_jkk NUMERIC(15, 2) DEFAULT 0,
  bpjs_tk_jkm NUMERIC(15, 2) DEFAULT 0,
  bpjs_tk_jp_employee NUMERIC(15, 2) DEFAULT 0,
  bpjs_tk_jp_company NUMERIC(15, 2) DEFAULT 0,
  net_salary NUMERIC(15, 2) NOT NULL,
  payment_status TEXT DEFAULT 'pending', -- pending, paid
  payment_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(employee_id, period_start, period_end)
);

-- Create calendar_events table for Google Calendar integration
CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  event_type TEXT NOT NULL, -- payroll, tax, bpjs, attendance
  google_event_id TEXT,
  related_id UUID, -- Can reference payroll.id, attendance.id, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row level security for each table
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Create basic policies (for now allowing all authenticated users to view)
CREATE POLICY "Allow all authenticated users to view departments" 
  ON departments FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all authenticated users to view positions" 
  ON positions FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all authenticated users to view employees" 
  ON employees FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all authenticated users to view attendance" 
  ON attendance FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all authenticated users to view payroll" 
  ON payroll FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all authenticated users to view calendar_events" 
  ON calendar_events FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Create function to calculate BPJS Kesehatan contributions
CREATE OR REPLACE FUNCTION calculate_bpjs_kesehatan(salary NUMERIC)
RETURNS TABLE(employee NUMERIC, company NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT
    salary * 0.01 AS employee,
    salary * 0.04 AS company;
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate BPJS Ketenagakerjaan contributions
CREATE OR REPLACE FUNCTION calculate_bpjs_ketenagakerjaan(salary NUMERIC)
RETURNS TABLE(jht_employee NUMERIC, jht_company NUMERIC, jkk NUMERIC, jkm NUMERIC, jp_employee NUMERIC, jp_company NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT
    salary * 0.02 AS jht_employee,
    salary * 0.037 AS jht_company,
    salary * 0.0024 AS jkk,
    salary * 0.003 AS jkm,
    salary * 0.01 AS jp_employee,
    salary * 0.02 AS jp_company;
END;
$$ LANGUAGE plpgsql;

-- Create function for a simplified PPh 21 calculation (this is a basic example; real calculations are more complex)
CREATE OR REPLACE FUNCTION calculate_pph21(gross_salary NUMERIC, tax_status TEXT) 
RETURNS NUMERIC AS $$
DECLARE
  ptkp NUMERIC;
  taxable_income NUMERIC;
  tax NUMERIC;
BEGIN
  -- Set PTKP based on tax status (simplified)
  CASE tax_status
    WHEN 'TK/0' THEN ptkp := 54000000;
    WHEN 'K/0' THEN ptkp := 58500000;
    WHEN 'K/1' THEN ptkp := 63000000;
    WHEN 'K/2' THEN ptkp := 67500000;
    WHEN 'K/3' THEN ptkp := 72000000;
    ELSE ptkp := 54000000;
  END CASE;
  
  -- Calculate annual taxable income
  taxable_income := (gross_salary * 12) - ptkp;
  IF taxable_income <= 0 THEN
    RETURN 0;
  END IF;
  
  -- Apply progressive tax rates (simplified)
  IF taxable_income <= 50000000 THEN
    tax := taxable_income * 0.05;
  ELSIF taxable_income <= 250000000 THEN
    tax := 2500000 + ((taxable_income - 50000000) * 0.15);
  ELSIF taxable_income <= 500000000 THEN
    tax := 32500000 + ((taxable_income - 250000000) * 0.25);
  ELSE
    tax := 95000000 + ((taxable_income - 500000000) * 0.30);
  END IF;
  
  -- Return monthly tax amount
  RETURN ROUND(tax / 12, 2);
END;
$$ LANGUAGE plpgsql;

-- Create view for employee summary
CREATE VIEW employee_summary AS
SELECT
  e.id,
  e.nik,
  e.first_name || ' ' || COALESCE(e.last_name, '') AS full_name,
  e.email,
  e.phone,
  d.name AS department,
  p.title AS position,
  p.salary_base,
  e.hire_date,
  e.tax_status,
  e.npwp,
  e.bpjs_kesehatan,
  e.bpjs_ketenagakerjaan
FROM
  employees e
JOIN
  positions p ON e.position_id = p.id
JOIN
  departments d ON p.department_id = d.id;

-- Create view for attendance summary by employee and month
CREATE VIEW attendance_summary AS
SELECT
  e.id AS employee_id,
  e.first_name || ' ' || COALESCE(e.last_name, '') AS full_name,
  DATE_TRUNC('month', a.date) AS month,
  COUNT(*) AS total_days,
  COUNT(*) FILTER (WHERE a.status = 'present') AS present_days,
  COUNT(*) FILTER (WHERE a.status = 'absent') AS absent_days,
  COUNT(*) FILTER (WHERE a.status = 'sick') AS sick_days,
  COUNT(*) FILTER (WHERE a.status = 'leave') AS leave_days
FROM
  employees e
JOIN
  attendance a ON e.id = a.employee_id
GROUP BY
  e.id, e.first_name, e.last_name, DATE_TRUNC('month', a.date);

-- Create view for payroll summary
CREATE VIEW payroll_summary AS
SELECT
  p.id,
  e.first_name || ' ' || COALESCE(e.last_name, '') AS full_name,
  d.name AS department,
  pos.title AS position,
  p.period_start,
  p.period_end,
  p.basic_salary,
  p.allowances,
  p.overtime,
  p.deductions,
  p.pph21,
  p.bpjs_kes_employee + p.bpjs_kes_company AS bpjs_kesehatan_total,
  p.bpjs_tk_jht_employee + p.bpjs_tk_jht_company + p.bpjs_tk_jkk + p.bpjs_tk_jkm + p.bpjs_tk_jp_employee + p.bpjs_tk_jp_company AS bpjs_ketenagakerjaan_total,
  p.net_salary,
  p.payment_status
FROM
  payroll p
JOIN
  employees e ON p.employee_id = e.id
JOIN
  positions pos ON e.position_id = pos.id
JOIN
  departments d ON pos.department_id = d.id;
