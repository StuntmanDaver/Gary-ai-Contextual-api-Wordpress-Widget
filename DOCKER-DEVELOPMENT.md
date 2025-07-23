# Gary AI Docker Development Environment

This document provides comprehensive instructions for using the Docker-based development environment for the Gary AI WordPress plugin.

## 🐳 Overview

The Docker environment provides:
- **WordPress 6.4** with PHP 8.0 and Apache
- **MySQL 8.0** database
- **phpMyAdmin** for database management
- **Node.js 18** with all testing dependencies pre-installed
- **Automated dependency management** for both PHP and Node.js
- **Complete testing suite** with Jest and Playwright
- **Development tools** including Vite dev server

## 🚀 Quick Start

### Prerequisites
- Docker Desktop installed and running
- Git (for cloning the repository)

### 1. Start Development Environment

**Windows (PowerShell):**
```powershell
.\docker-dev.ps1 start
```

**Linux/Mac (Bash):**
```bash
chmod +x docker-dev.sh
./docker-dev.sh start
```

This will:
- Build and start all Docker containers
- Install PHP dependencies via Composer
- Install Node.js dependencies via npm
- Set up the complete development environment

### 2. Access Services

After starting, you can access:
- **WordPress**: http://localhost:8080
- **phpMyAdmin**: http://localhost:8081
- **Vite Dev Server**: http://localhost:3000

## 🧪 Running Tests

### All Tests
```powershell
# Windows
.\docker-dev.ps1 test

# Linux/Mac
./docker-dev.sh test
```

### Jest Unit Tests Only
```powershell
# Windows
.\docker-dev.ps1 jest

# Linux/Mac
./docker-dev.sh jest
```

### Playwright E2E Tests Only
```powershell
# Windows
.\docker-dev.ps1 playwright

# Linux/Mac
./docker-dev.sh playwright
```

### Playwright UI Mode (Interactive)
```powershell
# Windows
.\docker-dev.ps1 playwright-ui

# Linux/Mac
./docker-dev.sh playwright-ui
```

## 🛠️ Development Commands

### Build Production Assets
```powershell
# Windows
.\docker-dev.ps1 build

# Linux/Mac
./docker-dev.sh build
```

### Start Vite Development Server
```powershell
# Windows
.\docker-dev.ps1 dev

# Linux/Mac
./docker-dev.sh dev
```

### Access Container Shells
```powershell
# Node.js container
.\docker-dev.ps1 shell node

# WordPress container
.\docker-dev.ps1 shell wordpress

# MySQL container
.\docker-dev.ps1 shell db
```

### View Container Logs
```powershell
# All logs
.\docker-dev.ps1 logs all

# WordPress logs
.\docker-dev.ps1 logs wordpress

# Node.js logs
.\docker-dev.ps1 logs node
```

### Check Status
```powershell
# Windows
.\docker-dev.ps1 status

# Linux/Mac
./docker-dev.sh status
```

### Stop Environment
```powershell
# Windows
.\docker-dev.ps1 stop

# Linux/Mac
./docker-dev.sh stop
```

### Clean Up (Remove all containers and volumes)
```powershell
# Windows
.\docker-dev.ps1 clean

# Linux/Mac
./docker-dev.sh clean
```

## 📁 Container Structure

### Services
- **wordpress**: WordPress 6.4 with PHP 8.0
- **db**: MySQL 8.0 database
- **phpmyadmin**: Database management interface
- **node-dev**: Node.js development environment
- **composer**: PHP dependency management
- **test-runner**: Dedicated testing environment

### Volumes
- **wordpress_data**: Persistent WordPress files
- **db_data**: Persistent database data
- **node_modules**: Persistent Node.js dependencies

### Networks
- **gary-ai-network**: Internal network for all services

## 🔧 Configuration

### WordPress Configuration
The WordPress container is pre-configured with:
- Debug mode enabled
- Gary AI plugin constants defined
- WordPress nonce authentication
- Proper file permissions

### Node.js Configuration
The Node.js container includes:
- All testing dependencies (Jest, Playwright, Babel)
- System browsers for Playwright
- Development tools (Vite, ESLint, Prettier)
- Coverage reporting tools

### Database Configuration
- **Database**: wordpress
- **Username**: wordpress
- **Password**: wordpress
- **Root Password**: rootpassword

## 🧪 Testing Architecture

### Jest Unit Tests
- **Location**: `tests/unit/`
- **Configuration**: `jest.config.js`
- **Setup**: `tests/setup.js`
- **Coverage**: 80%+ threshold enforced

### Playwright E2E Tests
- **Location**: `tests/e2e/`
- **Configuration**: `playwright.config.js`
- **Browsers**: Chrome, Firefox, Safari
- **Reports**: HTML reports generated

### Test Coverage
The test suite covers:
- ✅ **ApiClient** - REST API communication
- ✅ **MarkdownRenderer** - Markdown processing
- ✅ **ChatWidget** - Main component logic
- ✅ **End-to-End Workflows** - Complete user interactions

## 🔍 Troubleshooting

### Common Issues

**Docker not running:**
```
Error: Docker is not running
Solution: Start Docker Desktop
```

**Port conflicts:**
```
Error: Port already in use
Solution: Stop conflicting services or change ports in docker-compose.yml
```

**Permission errors:**
```
Error: Permission denied
Solution: Run with appropriate permissions or check file ownership
```

### Reset Environment
If you encounter persistent issues:
```powershell
# Stop and clean everything
.\docker-dev.ps1 clean

# Restart fresh
.\docker-dev.ps1 start
```

## 📊 Performance Optimization

### Development Mode
- Uses volume mounts for live code reloading
- Enables WordPress debug mode
- Includes development tools

### Production Mode
- Optimized builds with `npm run build`
- Minified assets
- Production-ready configurations

## 🔒 Security Notes

- Default passwords are for development only
- WordPress debug mode is enabled
- All services run on localhost
- Use proper credentials in production

## 📚 Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [WordPress Docker Image](https://hub.docker.com/_/wordpress)
- [Node.js Docker Image](https://hub.docker.com/_/node)
- [Playwright Documentation](https://playwright.dev/)
- [Jest Documentation](https://jestjs.io/)

## 🎯 Next Steps

1. **Start the environment**: `.\docker-dev.ps1 start`
2. **Run tests**: `.\docker-dev.ps1 test`
3. **Access WordPress**: http://localhost:8080
4. **Begin development**: Edit files and see live changes
5. **Run specific tests**: Use individual test commands as needed

The Docker environment eliminates dependency management issues and provides a consistent, reproducible development experience across all platforms.
