CREATE TABLE submissions (
        id INTEGER PRIMARY KEY,
        ip_hash TEXT NOT NULL,
        created_at INTEGER NOT NULL
);

CREATE INDEX idx_submissions_ip_created ON submissions (ip_hash, created_at);
CREATE INDEX idx_submissions_created ON submissions (created_at);

CREATE TABLE blocked_ips (
        ip_hash TEXT PRIMARY KEY,
        blocked_at INTEGER NOT NULL
);