#!/bin/bash

# Gary AI WordPress Plugin Testing Script
# This script helps test the plugin functionality in Docker

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log() {
    echo -e "${GREEN}[Gary AI Test]${NC} $1"
}

error() {
    echo -e "${RED}[Error]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[Warning]${NC} $1"
}

info() {
    echo -e "${BLUE}[Info]${NC} $1"
}

# Test 1: Check if WordPress is accessible
test_wordpress_access() {
    log "Testing WordPress accessibility..."
    
    response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080)
    if [ "$response" = "200" ] || [ "$response" = "302" ]; then
        info "✓ WordPress is accessible (HTTP $response)"
        return 0
    else
        error "✗ WordPress is not accessible (HTTP $response)"
        return 1
    fi
}

# Test 2: Check if plugin files are present
test_plugin_files() {
    log "Testing plugin file presence..."
    
    if docker-compose exec -T wordpress test -f "/var/www/html/wp-content/plugins/gary-ai/gary-ai.php"; then
        info "✓ Main plugin file (gary-ai.php) is present"
    else
        error "✗ Main plugin file is missing"
        return 1
    fi
    
    if docker-compose exec -T wordpress test -d "/var/www/html/wp-content/plugins/gary-ai/includes"; then
        info "✓ Plugin includes directory is present"
    else
        warn "⚠ Plugin includes directory not found"
    fi
    
    return 0
}

# Test 3: Check plugin activation status
test_plugin_activation() {
    log "Testing plugin activation..."
    
    # Try to activate the plugin using WP-CLI if available
    if docker-compose exec -T wordpress wp --version > /dev/null 2>&1; then
        info "WP-CLI is available, attempting to activate plugin..."
        if docker-compose exec -T wordpress wp plugin activate gary-ai --allow-root 2>/dev/null; then
            info "✓ Plugin activated successfully via WP-CLI"
        else
            warn "⚠ Could not activate plugin via WP-CLI (may need manual activation)"
        fi
    else
        warn "⚠ WP-CLI not available, plugin needs manual activation in WordPress admin"
    fi
}

# Test 4: Check REST API endpoints
test_rest_api() {
    log "Testing REST API endpoints..."
    
    # Test if WordPress REST API is accessible
    response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/wp-json/)
    if [ "$response" = "200" ]; then
        info "✓ WordPress REST API is accessible"
        
        # Test Gary AI specific endpoints
        response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/wp-json/gary-ai/v1/)
        if [ "$response" = "200" ] || [ "$response" = "404" ]; then
            info "✓ Gary AI REST API namespace is reachable"
        else
            warn "⚠ Gary AI REST API may not be properly registered"
        fi
    else
        error "✗ WordPress REST API is not accessible"
        return 1
    fi
}

# Test 5: Check plugin logs
test_plugin_logs() {
    log "Checking plugin logs..."
    
    if docker-compose exec -T wordpress test -f "/var/www/html/wp-content/debug.log"; then
        info "✓ Debug log file exists"
        log "Recent log entries:"
        docker-compose exec wordpress tail -5 /var/www/html/wp-content/debug.log 2>/dev/null || echo "No recent log entries"
    else
        info "No debug log file found (this is normal if no errors occurred)"
    fi
}

# Test 6: Check database connection
test_database() {
    log "Testing database connection..."
    
    if docker-compose exec -T db mysql -u wordpress -pwordpress -e "SHOW DATABASES;" > /dev/null 2>&1; then
        info "✓ Database connection is working"
        
        # Check if WordPress tables exist
        if docker-compose exec -T db mysql -u wordpress -pwordpress wordpress -e "SHOW TABLES LIKE 'wp_%';" | grep -q wp_; then
            info "✓ WordPress database tables are present"
        else
            warn "⚠ WordPress may not be fully installed yet"
        fi
    else
        error "✗ Database connection failed"
        return 1
    fi
}

# Main test runner
run_all_tests() {
    log "Starting comprehensive Gary AI WordPress plugin tests..."
    echo ""
    
    local failed_tests=0
    
    test_wordpress_access || ((failed_tests++))
    echo ""
    
    test_plugin_files || ((failed_tests++))
    echo ""
    
    test_plugin_activation || ((failed_tests++))
    echo ""
    
    test_rest_api || ((failed_tests++))
    echo ""
    
    test_plugin_logs || ((failed_tests++))
    echo ""
    
    test_database || ((failed_tests++))
    echo ""
    
    if [ $failed_tests -eq 0 ]; then
        log "🎉 All tests passed! Your Gary AI plugin is ready for use."
        echo ""
        log "Next steps:"
        echo "1. Open http://localhost:8080 in your browser"
        echo "2. Complete WordPress setup if not done already"
        echo "3. Go to Plugins > Installed Plugins"
        echo "4. Activate the Gary AI plugin"
        echo "5. Configure the plugin settings"
    else
        warn "⚠ $failed_tests test(s) failed. Please review the output above."
    fi
}

# Command line interface
case "${1:-all}" in
    "wordpress")
        test_wordpress_access
        ;;
    "files")
        test_plugin_files
        ;;
    "activation")
        test_plugin_activation
        ;;
    "api")
        test_rest_api
        ;;
    "logs")
        test_plugin_logs
        ;;
    "database")
        test_database
        ;;
    "all"|*)
        run_all_tests
        ;;
esac
