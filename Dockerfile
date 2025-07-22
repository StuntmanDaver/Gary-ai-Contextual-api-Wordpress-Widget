# Development Dockerfile for Gary AI WordPress Plugin
FROM wordpress:6.4-php8.0-apache

# Install additional PHP extensions and tools
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    curl \
    vim \
    && docker-php-ext-install pdo_mysql \
    && rm -rf /var/lib/apt/lists/*

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy plugin files
COPY . /var/www/html/wp-content/plugins/gary-ai/

# Set proper permissions
RUN chown -R www-data:www-data /var/www/html/wp-content/plugins/gary-ai

# Install PHP dependencies
WORKDIR /var/www/html/wp-content/plugins/gary-ai
RUN composer install --no-dev --optimize-autoloader

# Back to WordPress root
WORKDIR /var/www/html

# Expose port
EXPOSE 80
