export enum eventProgress {
  'STOPPED' = 0,
  'PLAYING' = 1,
  'PAUSED' = 2,
  'COMPLETED' = 3
}

-- Create eventTypes table first (due to foreign key dependency)
CREATE TABLE eventTypes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    sort_order INT DEFAULT 0,
    created_at DATETIME NOT NULL
);

CREATE TABLE accessLevels (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255) NULL,
    sort_order INT DEFAULT 0
);

CREATE TABLE eventStatesDictionary (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    sort_order INT DEFAULT 0
);

CREATE TABLE schedules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    active_event_id INT NOT NULL,
    is_playing BOOLEAN NOT NULL,
    created_by VARCHAR(255) NOT NULL COMMENT 'user_handler',
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    INDEX idx_created_by (created_by)
);

CREATE TABLE events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    length INT NOT NULL COMMENT 'Duration in seconds',
    is_rest BOOLEAN NOT NULL,
    schedule_id INT NOT NULL,
    schedule_position FLOAT NOT NULL,
    playhead INT NOT NULL,
    FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE,
    INDEX idx_schedule_order (schedule_id, schedule_position),
);

CREATE TABLE scheduleToUser (
    id INT PRIMARY KEY AUTO_INCREMENT,
    schedule_id INT NOT NULL,
    user_handler VARCHAR(255) NOT NULL COMMENT 'Reference to user from external system',
    access_level_id INT NOT NULL COMMENT 'DELETE=3 UPDATE=2 READ=1',
    FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE,
    INDEX idx_user_handler (user_handler),
    INDEX idx_schedule_user (schedule_id, user_handler)
);

CREATE TABLE eventStateHooks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    event_id INT NOT NULL,
    trigger_event_state_id INT NOT NULL COMMENT 'State that triggers this hook (0=STOPPED,1=PLAYING,2=PAUSED,3=COMPLETED)',
    action_type VARCHAR(50) NOT NULL COMMENT 'webhook, notification, email, script, chain_event, etc.',
    action_config JSON NOT NULL COMMENT 'Configuration parameters for the action type',
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    INDEX idx_event_trigger (event_id, trigger_event_state_id)
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
при входе подключаемся к стриму через tik@web

todo:
сделать единое? апи, которое будет отдавать все ивенты
