0=inactive, 1=active, 2=paused

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
    length INT NOT NULL COMMENT 'Duration in seconds,
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

CREATE TABLE eventState (
    id INT PRIMARY KEY AUTO_INCREMENT,
    eventId INT NOT NULL UNIQUE,
    state INT NOT NULL COMMENT 'State number (0=inactive, 1=active, 2=paused, etc.)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (eventId) REFERENCES events(id) ON DELETE CASCADE,
    INDEX idx_state (state),
    INDEX idx_event_state (eventId, state)
);


todo:
1
change
"poolId": "doro@web_events_2",
"config": "default",
to
"poolId": "userHandler",
"config": "{ doro@web: hash }",


tik@ может быть использован как синхронизатор стейта разных приложений.

при входе подключаемся (создаем если нет) к стриму (пул = юзер)
