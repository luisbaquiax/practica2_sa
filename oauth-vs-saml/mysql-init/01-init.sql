CREATE DATABASE IF NOT EXISTS saml_poc CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Usuario de aplicación con permisos sobre ambas bases
CREATE USER IF NOT EXISTS 'app_user'@'%' IDENTIFIED BY 'app_pass';
GRANT ALL PRIVILEGES ON oauth_poc.* TO 'app_user'@'%';
GRANT ALL PRIVILEGES ON saml_poc.* TO 'app_user'@'%';
FLUSH PRIVILEGES;