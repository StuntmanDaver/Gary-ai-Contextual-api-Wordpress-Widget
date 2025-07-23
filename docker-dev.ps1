# Gary AI Docker Development Environment Scripts (PowerShell)
# Provides easy commands for development and testing

param(
    [Parameter(Position=0)]
    [string]$Command = "help",
    [Parameter(Position=1)]
    [string]$Service = ""
)

# Colors for output
$Red = "`e[31m"
$Green = "`e[32m"
$Yellow = "`e[33m"
$Blue = "`e[34m"
$Reset = "`e[0m"

# Helper functions for colored output
function Write-Log {
    param([string]$Message)
    Write-Host "${Green}[Gary AI]${Reset} $Message"
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "${Red}[Error]${Reset} $Message"
}

function Write-Warning-Custom {
    param([string]$Message)
    Write-Host "${Yellow}[Warning]${Reset} $Message"
}

function Write-Info {
    param([string]$Message)
    Write-Host "${Blue}[Info]${Reset} $Message"
}

# Function to check if Docker is running
function Test-Docker {
    try {
        docker info | Out-Null
        return $true
    }
    catch {
        Write-Error-Log "Docker is not running. Please start Docker Desktop."
        exit 1
    }
}

function Start-Development {
    Write-Log "Starting Gary AI development environment..."
    Test-Docker
    
    # Build and start all services
    docker-compose up -d wordpress db phpmyadmin node-dev
    
    # Install PHP dependencies
    Write-Log "Installing PHP dependencies..."
    docker-compose run --rm composer install
    
    # Install Node.js dependencies
    Write-Log "Installing Node.js dependencies..."
    docker-compose exec node-dev npm install
    
    Write-Log "Development environment started successfully!"
    Write-Info-Log "WordPress: http://localhost:8080"
    Write-Info-Log "phpMyAdmin: http://localhost:8081"
    Write-Info-Log "Vite Dev Server: http://localhost:3000"
    Write-Info-Log ""
    Write-Info-Log "To run tests, use: .\docker-dev.ps1 test"
    Write-Info-Log "To stop environment, use: .\docker-dev.ps1 stop"
}

function Invoke-Tests {
    Write-Log "Running Gary AI test suite..."
    Test-Docker
    
    # Ensure node-dev is running
    docker-compose up -d node-dev
    
    # Run Jest unit tests
    Write-Log "Running Jest unit tests..."
    docker-compose exec node-dev npm test
    
    # Run Playwright E2E tests
    Write-Log "Running Playwright E2E tests..."
    docker-compose exec node-dev npm run e2e
    
    Write-Log "All tests completed!"
}

function Invoke-Jest {
    Write-Log "Running Jest unit tests..."
    Test-Docker
    docker-compose up -d node-dev
    docker-compose exec node-dev npm test
}

function Invoke-Playwright {
    Write-Log "Running Playwright E2E tests..."
    Test-Docker
    docker-compose up -d node-dev
    docker-compose exec node-dev npm run e2e
}

function Invoke-PlaywrightUI {
    Write-Log "Starting Playwright UI mode..."
    Test-Docker
    docker-compose up -d node-dev
    Write-Info-Log "Playwright UI will be available at http://localhost:9323"
    docker-compose exec node-dev npx playwright test --ui --ui-host=0.0.0.0
}

function Build-Assets {
    Write-Log "Building production assets..."
    Test-Docker
    docker-compose up -d node-dev
    docker-compose exec node-dev npm run build
    Write-Log "Production assets built successfully!"
}

function Start-Vite {
    Write-Log "Starting Vite development server..."
    Test-Docker
    docker-compose up -d node-dev
    Write-Info-Log "Vite dev server will be available at http://localhost:3000"
    docker-compose exec node-dev npm run dev
}

function Enter-Shell {
    param([string]$Container)
    
    switch ($Container) {
        { $_ -in @("node", "nodejs") } {
            Write-Log "Opening Node.js container shell..."
            docker-compose exec node-dev sh
        }
        { $_ -in @("wordpress", "wp") } {
            Write-Log "Opening WordPress container shell..."
            docker-compose exec wordpress bash
        }
        { $_ -in @("db", "mysql") } {
            Write-Log "Opening MySQL container shell..."
            docker-compose exec db mysql -u wordpress -pwordpress wordpress
        }
        default {
            Write-Error-Log "Unknown container. Available: node, wordpress, db"
            exit 1
        }
    }
}

function Show-Logs {
    param([string]$Service)
    
    switch ($Service) {
        { $_ -in @("wordpress", "wp") } {
            docker-compose logs -f wordpress
        }
        "node" {
            docker-compose logs -f node-dev
        }
        { $_ -in @("db", "mysql") } {
            docker-compose logs -f db
        }
        { $_ -in @("all", "") } {
            docker-compose logs -f
        }
        default {
            Write-Error-Log "Unknown service. Available: wordpress, node, db, all"
            exit 1
        }
    }
}

function Stop-Environment {
    Write-Log "Stopping Gary AI development environment..."
    docker-compose down
    Write-Log "Environment stopped."
}

function Clear-Environment {
    Write-Warning-Log "This will remove all containers and volumes. Are you sure? (y/N)"
    $response = Read-Host
    if ($response -match "^[yY]([eE][sS])?$") {
        Write-Log "Cleaning up Gary AI environment..."
        docker-compose down -v --remove-orphans
        docker-compose rm -f
        Write-Log "Environment cleaned up."
    }
    else {
        Write-Info-Log "Clean up cancelled."
    }
}

function Show-Status {
    Write-Log "Gary AI Development Environment Status:"
    docker-compose ps
}

function Show-Help {
    Write-Host "Gary AI Docker Development Environment" -ForegroundColor Green
    Write-Host ""
    Write-Host "Usage: .\docker-dev.ps1 [command]"
    Write-Host ""
    Write-Host "Commands:"
    Write-Host "  start       Start the development environment"
    Write-Host "  stop        Stop the development environment"
    Write-Host "  test        Run all tests (Jest + Playwright)"
    Write-Host "  jest        Run Jest unit tests only"
    Write-Host "  playwright  Run Playwright E2E tests only"
    Write-Host "  playwright-ui  Run Playwright in UI mode"
    Write-Host "  build       Build production assets"
    Write-Host "  dev         Start Vite development server"
    Write-Host "  shell       Access container shell (node|wordpress|db)"
    Write-Host "  logs        View container logs (wordpress|node|db|all)"
    Write-Host "  status      Show container status"
    Write-Host "  clean       Remove all containers and volumes"
    Write-Host "  help        Show this help message"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\docker-dev.ps1 start              # Start development environment"
    Write-Host "  .\docker-dev.ps1 test               # Run all tests"
    Write-Host "  .\docker-dev.ps1 shell node         # Access Node.js container"
    Write-Host "  .\docker-dev.ps1 logs wordpress     # View WordPress logs"
}

# Main command dispatcher
switch ($Command.ToLower()) {
    "start" { Start-Development }
    "stop" { Stop-Environment }
    "test" { Invoke-Tests }
    "jest" { Invoke-Jest }
    "playwright" { Invoke-Playwright }
    "playwright-ui" { Invoke-PlaywrightUI }
    "build" { Build-Assets }
    "dev" { Start-Vite }
    "shell" { Enter-Shell $SubCommand }
    "logs" { Show-Logs $SubCommand }
    "status" { Show-Status }
    "clean" { Clear-Environment }
    { $_ -in @("help", "--help", "-h") } { Show-Help }
    default {
        Write-Error-Log "Unknown command: $Command"
        Show-Help
        exit 1
    }
}
