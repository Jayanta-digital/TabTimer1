# 🗄️ TabTimer Database Setup Guide

This guide will help you set up the complete database schema for TabTimer using Supabase.

## Prerequisites

1. Create a Supabase project at https://supabase.com
2. Access the SQL Editor in your Supabase dashboard

## Step 1: Create Tables

Copy and paste the following SQL commands in the Supabase SQL Editor:

### 1. Users Table

```sql
CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('caregiver', 'patient')),
    caregiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
    is_paid BOOLEAN DEFAULT FALSE,
    phone VARCHAR(20),
    profile_image_url TEXT,
    subscription_type VARCHAR(20) DEFAULT 'free',
    subscription_end_date TIMESTAMP,
    max_medicines INTEGER DEFAULT 3,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP,
    active BOOLEAN DEFAULT TRUE
);

-- Create index for faster queries
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_caregiver ON users(caregiver_id);
CREATE INDEX idx_users_role ON users(role);
```

### 2. Medicines Table

```sql
CREATE TABLE medicines (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    caregiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100),
    time TIME NOT NULL,
    frequency VARCHAR(50) DEFAULT 'daily',
    days_of_week INTEGER[], -- Array: 0=Sunday, 1=Monday, etc.
    stock INTEGER NOT NULL DEFAULT 30,
    low_stock_threshold INTEGER DEFAULT 5,
    instructions TEXT,
    voice_file_id TEXT, -- Google Drive file ID
    voice_file_url TEXT,
    image_url TEXT,
    color VARCHAR(7) DEFAULT '#667eea',
    status VARCHAR(20) DEFAULT 'ACTIVE',
    last_taken TIMESTAMP,
    next_reminder TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_medicines_patient ON medicines(patient_id);
CREATE INDEX idx_medicines_caregiver ON medicines(caregiver_id);
CREATE INDEX idx_medicines_time ON medicines(time);
CREATE INDEX idx_medicines_status ON medicines(status);
```

### 3. Medicine Logs Table

```sql
CREATE TABLE medicine_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    medicine_id UUID NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(20) NOT NULL CHECK (action IN ('TAKEN', 'MISSED', 'SKIPPED')),
    taken_at TIMESTAMP DEFAULT NOW(),
    scheduled_time TIMESTAMP NOT NULL,
    stock_after INTEGER,
    notes TEXT,
    reminder_method VARCHAR(50)
);

-- Create indexes
CREATE INDEX idx_logs_medicine ON medicine_logs(medicine_id);
CREATE INDEX idx_logs_patient ON medicine_logs(patient_id);
CREATE INDEX idx_logs_action ON medicine_logs(action);
CREATE INDEX idx_logs_taken_at ON medicine_logs(taken_at);
```

### 4. Payments Table

```sql
CREATE TABLE payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    payment_method VARCHAR(50) NOT NULL,
    payment_id VARCHAR(255) UNIQUE NOT NULL,
    transaction_ref VARCHAR(255),
    upi_id VARCHAR(255),
    status VARCHAR(20) DEFAULT 'PENDING',
    plan_type VARCHAR(20) NOT NULL,
    valid_from TIMESTAMP DEFAULT NOW(),
    valid_until TIMESTAMP,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    metadata JSONB
);

-- Create indexes
CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_payment_id ON payments(payment_id);
```

### 5. Notifications Table

```sql
CREATE TABLE notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    medicine_id UUID REFERENCES medicines(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at);
```

### 6. Settings Table

```sql
CREATE TABLE settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_enabled BOOLEAN DEFAULT TRUE,
    sound_enabled BOOLEAN DEFAULT TRUE,
    vibration_enabled BOOLEAN DEFAULT TRUE,
    reminder_advance_minutes INTEGER DEFAULT 0,
    snooze_duration_minutes INTEGER DEFAULT 10,
    theme VARCHAR(20) DEFAULT 'light',
    language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create index
CREATE INDEX idx_settings_user ON settings(user_id);
```

## Step 2: Create Functions

### Auto-update Updated_at Timestamp

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medicines_updated_at BEFORE UPDATE ON medicines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Calculate Adherence Rate Function

```sql
CREATE OR REPLACE FUNCTION calculate_adherence_rate(
    p_patient_id UUID,
    p_days INTEGER DEFAULT 7
)
RETURNS NUMERIC AS $$
DECLARE
    total_doses INTEGER;
    taken_doses INTEGER;
    adherence_rate NUMERIC;
BEGIN
    -- Count total scheduled doses
    SELECT COUNT(*) INTO total_doses
    FROM medicine_logs
    WHERE patient_id = p_patient_id
        AND taken_at >= NOW() - INTERVAL '1 day' * p_days;
    
    -- Count taken doses
    SELECT COUNT(*) INTO taken_doses
    FROM medicine_logs
    WHERE patient_id = p_patient_id
        AND action = 'TAKEN'
        AND taken_at >= NOW() - INTERVAL '1 day' * p_days;
    
    -- Calculate rate
    IF total_doses > 0 THEN
        adherence_rate := (taken_doses::NUMERIC / total_doses::NUMERIC) * 100;
    ELSE
        adherence_rate := 0;
    END IF;
    
    RETURN ROUND(adherence_rate, 2);
END;
$$ LANGUAGE plpgsql;
```

### Get Today's Medicines Function

```sql
CREATE OR REPLACE FUNCTION get_todays_medicines(p_patient_id UUID)
RETURNS TABLE (
    medicine_id UUID,
    medicine_name VARCHAR,
    dosage VARCHAR,
    time TIME,
    status VARCHAR,
    taken_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.name,
        m.dosage,
        m.time,
        CASE 
            WHEN ml.action = 'TAKEN' THEN 'TAKEN'
            WHEN ml.action = 'SKIPPED' THEN 'SKIPPED'
            WHEN m.time < CURRENT_TIME THEN 'MISSED'
            ELSE 'PENDING'
        END as status,
        ml.taken_at
    FROM medicines m
    LEFT JOIN medicine_logs ml ON m.id = ml.medicine_id 
        AND ml.taken_at::date = CURRENT_DATE
    WHERE m.patient_id = p_patient_id
        AND m.status = 'ACTIVE'
    ORDER BY m.time;
END;
$$ LANGUAGE plpgsql;
```

## Step 3: Set Up Row Level Security (RLS)

### Enable RLS on All Tables

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicine_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
```

### Create RLS Policies

```sql
-- Users: Can view own profile and their caregiver/patients
CREATE POLICY users_select_policy ON users
    FOR SELECT
    USING (
        auth.uid() = id 
        OR auth.uid() = caregiver_id
        OR id IN (SELECT id FROM users WHERE caregiver_id = auth.uid())
    );

-- Users: Can update own profile
CREATE POLICY users_update_policy ON users
    FOR UPDATE
    USING (auth.uid() = id);

-- Medicines: Patients see their medicines, caregivers see their patients' medicines
CREATE POLICY medicines_select_policy ON medicines
    FOR SELECT
    USING (
        patient_id = auth.uid() 
        OR caregiver_id = auth.uid()
    );

-- Medicines: Only caregivers can insert/update/delete
CREATE POLICY medicines_insert_policy ON medicines
    FOR INSERT
    WITH CHECK (caregiver_id = auth.uid());

CREATE POLICY medicines_update_policy ON medicines
    FOR UPDATE
    USING (caregiver_id = auth.uid());

CREATE POLICY medicines_delete_policy ON medicines
    FOR DELETE
    USING (caregiver_id = auth.uid());

-- Medicine Logs: Patients and caregivers can view
CREATE POLICY logs_select_policy ON medicine_logs
    FOR SELECT
    USING (
        patient_id = auth.uid() 
        OR medicine_id IN (SELECT id FROM medicines WHERE caregiver_id = auth.uid())
    );

-- Medicine Logs: Patients can insert (mark as taken)
CREATE POLICY logs_insert_policy ON medicine_logs
    FOR INSERT
    WITH CHECK (patient_id = auth.uid());

-- Notifications: Users see their own notifications
CREATE POLICY notifications_select_policy ON notifications
    FOR SELECT
    USING (user_id = auth.uid());

-- Notifications: Can mark as read
CREATE POLICY notifications_update_policy ON notifications
    FOR UPDATE
    USING (user_id = auth.uid());

-- Settings: Users manage their own settings
CREATE POLICY settings_all_policy ON settings
    FOR ALL
    USING (user_id = auth.uid());
```

## Step 4: Insert Sample Data (Optional)

```sql
-- Sample Caregiver
INSERT INTO users (email, password_hash, name, role, phone, is_paid, subscription_type, max_medicines)
VALUES (
    'caregiver@example.com',
    '$2y$10$example_hash_here', -- Use proper password hashing
    'Dr. Sarah Johnson',
    'caregiver',
    '+91 98765 43210',
    TRUE,
    'premium',
    -1
);

-- Sample Patient (get caregiver_id from previous insert)
INSERT INTO users (email, password_hash, name, role, phone, caregiver_id)
VALUES (
    'patient@example.com',
    '$2y$10$example_hash_here',
    'John Doe',
    'patient',
    '+91 98765 43211',
    (SELECT id FROM users WHERE email = 'caregiver@example.com')
);

-- Sample Medicine
INSERT INTO medicines (patient_id, caregiver_id, name, dosage, time, stock, color, instructions)
VALUES (
    (SELECT id FROM users WHERE email = 'patient@example.com'),
    (SELECT id FROM users WHERE email = 'caregiver@example.com'),
    'Aspirin',
    '500mg, 2 tablets',
    '08:00:00',
    30,
    '#3b82f6',
    'Take with water after breakfast'
);
```

## Step 5: Verify Setup

Run these queries to verify your setup:

```sql
-- Check table creation
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check indexes
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public';

-- Check RLS policies
SELECT schemaname, tablename, policyname 
FROM pg_policies;

-- Test functions
SELECT calculate_adherence_rate(
    (SELECT id FROM users WHERE role = 'patient' LIMIT 1),
    7
);
```

## Backup and Restore

### Create Backup

```sql
-- From your terminal (not SQL editor)
pg_dump -h db.your-project.supabase.co -U postgres -W your_database > backup.sql
```

### Restore from Backup

```sql
psql -h db.your-project.supabase.co -U postgres -W your_database < backup.sql
```

## Next Steps

1. ✅ All tables created
2. ✅ Indexes added for performance
3. ✅ Functions created
4. ✅ RLS policies configured
5. ⏭️ Update `js/config.js` with your Supabase URL and keys
6. ⏭️ Test database connectivity from your application

## Troubleshooting

**Connection Issues:**
- Verify Supabase project URL
- Check API keys (anon key vs service key)
- Ensure RLS policies are not too restrictive

**Performance Issues:**
- Add more indexes on frequently queried columns
- Use `EXPLAIN ANALYZE` to identify slow queries
- Consider partitioning for large tables

**RLS Issues:**
- Test policies with different user contexts
- Use `auth.uid()` correctly in policies
- Remember: Service role key bypasses RLS

---

For questions or issues, refer to the [Supabase Documentation](https://supabase.com/docs) or create an issue on GitHub.
