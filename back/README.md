-- Create eventTypes table first (due to foreign key dependency)
CREATE TABLE eventTypes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create events table
CREATE TABLE events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    length INT NOT NULL COMMENT 'Duration in minutes',
    type INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (type) REFERENCES eventTypes(id) ON DELETE RESTRICT
);

-- Create eventToUser table
CREATE TABLE eventToUser (
    id INT PRIMARY KEY AUTO_INCREMENT,
    event_id INT NOT NULL,
    user_handler VARCHAR(255) NOT NULL COMMENT 'Reference to user from external system',
    access_level ENUM('owner', 'editor', 'viewer') NOT NULL DEFAULT 'viewer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    INDEX idx_user_handler (user_handler),
    INDEX idx_event_user (event_id, user_handler)
);

-- eventState table with proper primary key for nullable connectionId
CREATE TABLE eventState (
    id INT PRIMARY KEY AUTO_INCREMENT,
    eventId INT NOT NULL,
    connectionId VARCHAR(255) NULL COMMENT 'External connection identifier',
    userHandler VARCHAR(255) NOT NULL COMMENT 'User who owns this connection',
    state INT NOT NULL COMMENT 'State number (0=inactive, 1=active, 2=paused, etc.)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_event_connection (eventId, connectionId), -- Composite unique key (allows one NULL per event)
    UNIQUE KEY unique_connection (connectionId), -- Enforce one-to-one relationship when connectionId is not null
    FOREIGN KEY (eventId) REFERENCES events(id) ON DELETE CASCADE,
    INDEX idx_user_handler (userHandler),
    INDEX idx_connection_id (connectionId),
    INDEX idx_state (state),
    INDEX idx_event_state (eventId, state),
    INDEX idx_user_state (userHandler, state)
);