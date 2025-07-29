-- Users table
CREATE TABLE users (
                       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                       email VARCHAR(255) UNIQUE NOT NULL,
                       password_hash VARCHAR(255) NOT NULL,
                       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add admin fields to users table
ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN is_approved BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN is_suspended BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN approved_by UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN approved_at TIMESTAMP;

-- Projects table
CREATE TABLE projects (
                          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                          name VARCHAR(255) NOT NULL,
                          data JSONB NOT NULL DEFAULT '{}',
                          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add archiving to projects table
ALTER TABLE projects ADD COLUMN is_archived BOOLEAN DEFAULT FALSE;
ALTER TABLE projects ADD COLUMN archived_by UUID REFERENCES users(id);
ALTER TABLE projects ADD COLUMN archived_at TIMESTAMP;

-- PDFs table
CREATE TABLE pdfs (
                      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                      project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
                      name VARCHAR(255) NOT NULL,
                      level VARCHAR(100),
                      file_url VARCHAR(500) NOT NULL,
                      file_size INTEGER,
                      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create admin logs table for audit trail
CREATE TABLE admin_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    target_project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_pdfs_project_id ON pdfs(project_id);
CREATE INDEX idx_projects_data ON projects USING GIN(data);
CREATE INDEX idx_users_is_admin ON users(is_admin);
CREATE INDEX idx_users_is_approved ON users(is_approved);
CREATE INDEX idx_projects_is_archived ON projects(is_archived);
CREATE INDEX idx_admin_logs_admin_id ON admin_logs(admin_id);
