-- Create user_devices table for storing FCM tokens per user (MySQL)
CREATE TABLE IF NOT EXISTS user_devices (
    id_device INT AUTO_INCREMENT PRIMARY KEY,
    id_user INT NOT NULL,
    fcm_token TEXT NOT NULL,
    last_active DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_devices_user FOREIGN KEY (id_user) REFERENCES users(id_user) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Optional: avoid duplicate tokens rows
-- Note: MySQL requires length for TEXT index
CREATE INDEX idx_user_devices_token ON user_devices(fcm_token(191));

