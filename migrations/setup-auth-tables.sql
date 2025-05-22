-- Check if users table exists and create if needed
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'users') THEN
    CREATE TABLE users (
      id VARCHAR(255) PRIMARY KEY,
      email VARCHAR(255) UNIQUE,
      first_name VARCHAR(255),
      last_name VARCHAR(255),
      profile_image_url VARCHAR(255),
      roles TEXT[] DEFAULT '{public}',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  END IF;
END
$$;

-- Check if sessions table exists and create if needed
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'sessions') THEN
    CREATE TABLE sessions (
      sid VARCHAR PRIMARY KEY,
      sess JSONB NOT NULL,
      expire TIMESTAMPTZ NOT NULL
    );
    CREATE INDEX IDX_session_expire ON sessions(expire);
  END IF;
END
$$;

-- Check if audit_logs table exists and create if needed
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'audit_logs') THEN
    CREATE TABLE audit_logs (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(255) REFERENCES users(id),
      action VARCHAR(64) NOT NULL,
      details JSONB,
      ip_address VARCHAR(64),
      user_agent TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    -- Create indexes for better query performance
    CREATE INDEX idx_audit_user ON audit_logs(user_id);
    CREATE INDEX idx_audit_action ON audit_logs(action);
    CREATE INDEX idx_audit_created_at ON audit_logs(created_at);
  END IF;
END
$$;

-- Insert some test users if none exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM users LIMIT 1) THEN
    INSERT INTO users (id, email, first_name, last_name, roles) VALUES 
    ('email-1', 'admin@bentoncounty.gov', 'Admin', 'User', '{admin}'),
    ('google-2', 'staff@bentoncounty.gov', 'Staff', 'User', '{staff}'),
    ('github-3', 'field@bentoncounty.gov', 'Field', 'User', '{field}'),
    ('email-4', 'readonly@bentoncounty.gov', 'Read', 'Only', '{readonly}');
  END IF;
END
$$;

-- Insert some test audit logs if none exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM audit_logs LIMIT 1) THEN
    INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES
    ('email-1', 'login_success', '{"provider": "email"}', '192.168.1.1'),
    ('google-2', 'login_success', '{"provider": "google"}', '192.168.1.2'),
    ('github-3', 'login_success', '{"provider": "github"}', '192.168.1.3'),
    ('email-1', 'role_change', '{"targetUserId": "email-4", "oldRoles": ["readonly"], "newRoles": ["staff"]}', '192.168.1.1');
  END IF;
END
$$;