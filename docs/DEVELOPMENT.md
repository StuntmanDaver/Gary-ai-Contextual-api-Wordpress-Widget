# Gary AI Development Environment

## Quick Start with Docker

### Prerequisites
- Docker Desktop installed and running
- Git installed

### Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/StuntmanDaver/Gary-ai-Contextual-api-Wordpress-Widget.git
   cd Gary-ai-Contextual-api-Wordpress-Widget
   ```

2. **Start the development environment:**
   ```bash
   docker-compose up -d
   ```

3. **Install PHP dependencies:**
   ```bash
   docker-compose run --rm composer install
   ```

4. **Access the development site:**
   - WordPress: http://localhost:9000
   - phpMyAdmin: http://localhost:9001

### Environment Configuration

Update the following constants in `docker-compose.yml` or your `wp-config.php`:

```php
define('GARY_AI_API_ENDPOINT', 'https://api.contextual.ai/');
// WordPress nonces are used for authentication - no JWT secret needed
define('GARY_AI_ENCRYPTION_KEY', 'your-32-byte-encryption-key-here');

// API Credentials (set in wp-config.php or environment)
define('CONTEXTUAL_AI_API_KEY', 'key-dODB6wQ_8CcXFQYoLLZX-BhrOHc2KidTu6y73PrewFOQDaCP4');
define('GARY_AI_AGENT_ID', 'YOUR_AGENT_ID');
define('GARY_AI_DATASTORE_ID', 'YOUR_DATASTORE_ID');
```

### Development Workflow

1. **Plugin Development:**
   - Plugin files are mounted at `/wp-content/plugins/gary-ai/`
   - Changes are reflected immediately
   - Activate the plugin in WordPress admin

2. **Database Access:**
   - Use phpMyAdmin at http://localhost:9001
   - Credentials: wordpress/wordpress

3. **Logs:**
   ```bash
   docker-compose logs -f wordpress
   ```

4. **Stop Environment:**
   ```bash
   docker-compose down
   ```

### Useful Commands

```bash
# Rebuild containers
docker-compose build

# Run Composer commands
docker-compose run --rm composer require package/name

# Access WordPress container
docker-compose exec wordpress bash

# Reset database
docker-compose down -v
docker-compose up -d
```

### Troubleshooting

- **Port conflicts:** Change ports in `docker-compose.yml`
- **Permission issues:** Run `docker-compose exec wordpress chown -R www-data:www-data /var/www/html/wp-content/plugins/gary-ai`
- **Database connection:** Ensure MySQL container is running before WordPress
