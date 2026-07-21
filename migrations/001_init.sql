-- 001_init.sql
-- Initial schema for habit tracker: users, habits, actions, sessions

CREATE TABLE users (
    id             CHAR(36)      PRIMARY KEY DEFAULT (UUID()),
    email          VARCHAR(255)  NOT NULL UNIQUE,
    email_verified BOOLEAN       NOT NULL DEFAULT FALSE,
    password_hash  VARCHAR(255)  NOT NULL,
    created_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE habits (
    id              CHAR(36)      PRIMARY KEY DEFAULT (UUID()),
    user_id         CHAR(36)      NOT NULL,
    name            VARCHAR(255)  NOT NULL,
    color           VARCHAR(20)   NOT NULL,
    icon            VARCHAR(100)  NOT NULL,
    state           ENUM('active','paused','deleted') NOT NULL DEFAULT 'active',
    goal_type       VARCHAR(20)   NOT NULL DEFAULT 'daily',
    target          INT           NOT NULL DEFAULT 1,
    completions_per_day INT       NOT NULL DEFAULT 1,
    reminder_time   TIME          NULL,
    created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_habits_user (user_id)
);

CREATE TABLE actions (
    id           CHAR(36)      PRIMARY KEY DEFAULT (UUID()),
    habit_id     CHAR(36)      NOT NULL,
    completed_at TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    value        DECIMAL(10,2) NULL,
    FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
    INDEX idx_actions_habit_completed (habit_id, completed_at)
);

CREATE TABLE sessions (
    id           CHAR(36)      PRIMARY KEY DEFAULT (UUID()),
    user_id      CHAR(36)      NOT NULL,
    token_hash   VARCHAR(255)  NOT NULL,
    device_name  VARCHAR(255)  NULL,
    created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at   TIMESTAMP     NOT NULL,
    revoked_at   TIMESTAMP     NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_sessions_user (user_id)
);