#!/bin/bash

# Gary AI Docker Development Environment Scripts
# Provides easy commands for development and testing

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper function for colored output
log() {
    echo -e "${GREEN}[Gary AI]${NC} $1"
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

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        error "Docker is not running. Please start Docker Desktop."
        exit 1
    fi
}

# Function to build and start development environment
start_dev() {
    log "Starting Gary AI development environment..."
    check_docker
    
    # Build and start all services
    docker-compose up -d wordpress db phpmyadmin node-dev
    
    # Install PHP dependencies
    log "Installing PHP dependencies..."
    docker-compose run --rm composer install
    
    # Wait for WordPress to be ready
    log "Waiting for WordPress to be ready..."
    sleep 10
    
    # Check plugin status
    check_plugin_status
    
    log "Development environment started!"
    log "WordPress: http://localhost:8080"
    log "phpMyAdmin: http://localhost:8081"
    log "Plugin logs: ./logs/"
    
    # Install Node.js dependencies
    log "Installing Node.js dependencies..."
    docker-compose exec node-dev npm install
    
    log "Development environment started successfully!"
    info "WordPress: http://localhost:8080"
    info "phpMyAdmin: http://localhost:8081"
    info "Vite Dev Server: http://localhost:3000"
    info ""
    info "To run tests, use: ./docker-dev.sh test"
    info "To stop environment, use: ./docker-dev.sh stop"
}

# Function to run tests
run_tests() {
    log "Running Gary AI test suite..."
    check_docker
    
    # Ensure node-dev is running
    docker-compose up -d node-dev
    
    # Run Jest unit tests
    log "Running Jest unit tests..."
    docker-compose exec node-dev npm test
    
    # Run Playwright E2E tests
    log "Running Playwright E2E tests..."
    docker-compose exec node-dev npm run e2e
    
    log "All tests completed!"
}

# Function to run only Jest tests
run_jest() {
    log "Running Jest unit tests..."
    check_docker
    docker-compose up -d node-dev
    docker-compose exec node-dev npm test
}

# Function to run only Playwright tests
run_playwright() {
    log "Running Playwright E2E tests..."
    check_docker
    docker-compose up -d node-dev
    docker-compose exec node-dev npm run e2e
}

# Function to run Playwright in UI mode
run_playwright_ui() {
    log "Starting Playwright UI mode..."
    check_docker
    docker-compose up -d node-dev
    info "Playwright UI will be available at http://localhost:9323"
    docker-compose exec node-dev npx playwright test --ui --ui-host=0.0.0.0
}

# Function to build production assets
build_assets() {
    log "Building production assets..."
    check_docker
    docker-compose up -d node-dev
    docker-compose exec node-dev npm run build
    log "Production assets built successfully!"
}

# Function to start development server
start_vite() {
    log "Starting Vite development server..."
    check_docker
    docker-compose up -d node-dev
    info "Vite dev server will be available at http://localhost:3000"
    docker-compose exec node-dev npm run dev
}

# Function to access shell in containers
shell() {
    case $1 in
        node|nodejs)
            log "Opening Node.js container shell..."
            docker-compose exec node-dev sh
            ;;
        wordpress|wp)
            log "Opening WordPress container shell..."
            docker-compose exec wordpress bash
            ;;
        db|mysql)
            log "Opening MySQL container shell..."
            docker-compose exec db mysql -u wordpress -pwordpress wordpress
            ;;
        *)
            error "Unknown container. Available: node, wordpress, db"
            exit 1
            ;;
    esac
}

# Function to view logs
logs() {
    case $1 in
        wordpress|wp)
            docker-compose logs -f wordpress
            ;;
        node)
            docker-compose logs -f node-dev
            ;;
        db|mysql)
            docker-compose logs -f db
            ;;
        all|"")
            docker-compose logs -f
            ;;
        *)
            error "Unknown service. Available: wordpress, node, db, all"
            exit 1
            ;;
    esac
}

# Function to stop environment
stop_env() {
    log "Stopping Gary AI development environment..."
    docker-compose down
    log "Environment stopped."
}

# Function to clean up (remove containers and volumes)
clean() {
    warn "This will remove all containers and volumes. Are you sure? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        log "Cleaning up Gary AI environment..."
        docker-compose down -v --remove-orphans
        docker-compose rm -f
        log "Environment cleaned up."
    else
        info "Clean up cancelled."
    fi
}

# Function to show status
status() {
    log "Gary AI Development Environment Status:"
    docker-compose ps
}

# Function to check plugin status
check_plugin_status() {
    log "Checking plugin status..."
    
    # Check if plugin files are mounted correctly
    if docker-compose exec -T wordpress test -f "/var/www/html/wp-content/plugins/gary-ai/gary-ai.php"; then
        info "✓ Plugin files are mounted correctly"
    else
        warn "✗ Plugin files not found in container"
    fi
    
    # Check if WordPress is responding
    if curl -s http://localhost:8080 > /dev/null; then
        info "✓ WordPress is responding"
    else
        warn "✗ WordPress is not responding yet"
    fi
}

# Function to view plugin logs
view_plugin_logs() {
    log "Viewing plugin debug logs..."
    
    if [ -f "./logs/debug.log" ]; then
        tail -f ./logs/debug.log
    else
        docker-compose exec wordpress tail -f /var/www/html/wp-content/debug.log 2>/dev/null || \
        warn "No debug logs found yet. Try accessing the plugin first."
    fi
}

# Function to activate plugin manually
activate_plugin() {
    log "Activating Gary AI plugin..."
    docker-compose exec wordpress wp plugin activate gary-ai --allow-root 2>/dev/null || \
    warn "Could not activate plugin automatically. Please activate manually in WordPress admin."
}

# Function to show help
show_help() {
    echo -e "${BLUE}Gary AI Docker Development Environment${NC}"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  start       Start development environment"
    echo "  stop        Stop all services"
    echo "  clean       Remove containers and volumes"
    echo "  status      Show container status"
    echo "  logs        View container logs"
    echo "  plugin-logs View plugin debug logs"
    echo "  plugin-status Check plugin status"
    echo "  activate    Activate plugin manually"
    echo "  shell       Access container shell"
    echo "  test        Run all tests"
    echo "  jest        Run Jest tests only"
    echo "  playwright  Run Playwright tests only"
    echo "  playwright-ui Run Playwright in UI mode"
    echo "  build       Build production assets"
    echo "  vite        Start Vite development server"
    echo "  help        Show this help message"
    echo ""
}

# Main command dispatcher
case $1 in
    start)
        start_dev
        ;;
    stop)
        stop_env
        ;;
    clean)
        clean
        ;;
    status)
        status
        ;;
    logs)
        logs $2
        ;;
    plugin-logs)
        view_plugin_logs
        ;;
    plugin-status)
        check_plugin_status
        ;;
    activate)
        activate_plugin
        ;;
    shell)
        shell $2
        ;;
    test)
        run_tests
        ;;
    jest)
        run_jest
        ;;
    playwright)
        run_playwright
        ;;
    playwright-ui)
        run_playwright_ui
        ;;
    build)
        build_assets
        ;;
    vite)
        start_vite
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
