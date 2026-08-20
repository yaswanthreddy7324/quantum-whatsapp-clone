# ============================================
# QUANTUM WHATSAPP CLONE - QUICK START SCRIPT
# ============================================

Write-Host "`n" -NoNewline
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  QUANTUM WHATSAPP CLONE - SETUP" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "[1/4] Checking Docker..." -ForegroundColor Yellow
try {
    docker --version | Out-Null
    Write-Host "  ✓ Docker is installed" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Docker is not installed or not running!" -ForegroundColor Red
    Write-Host "  Please install Docker Desktop and try again." -ForegroundColor Red
    exit 1
}

# Check if .env file exists
Write-Host "`n[2/4] Checking IBM Quantum API Key..." -ForegroundColor Yellow
$envFile = "quantum-service\.env"

if (Test-Path $envFile) {
    $content = Get-Content $envFile -Raw
    if ($content -match "IBM_QUANTUM_API_KEY=.+" -and $content -notmatch "paste_your_ibm_quantum_api_key_here") {
        Write-Host "  ✓ API key configured" -ForegroundColor Green
    } else {
        Write-Host "  ✗ API key not configured!" -ForegroundColor Red
        Write-Host ""
        Write-Host "  Please edit quantum-service\.env and add your IBM Quantum API key:" -ForegroundColor Yellow
        Write-Host "  IBM_QUANTUM_API_KEY=your_actual_api_key_here" -ForegroundColor White
        Write-Host ""
        Write-Host "  Get your API key from: https://quantum-computing.ibm.com/" -ForegroundColor Cyan
        Write-Host ""
        
        $createEnv = Read-Host "  Would you like to create the .env file now? (y/n)"
        if ($createEnv -eq "y" -or $createEnv -eq "Y") {
            $apiKey = Read-Host "  Enter your IBM Quantum API key"
            "IBM_QUANTUM_API_KEY=$apiKey" | Out-File -FilePath $envFile -Encoding UTF8
            Write-Host "  ✓ .env file created!" -ForegroundColor Green
        } else {
            Write-Host "  Please create the file manually and run this script again." -ForegroundColor Yellow
            exit 1
        }
    }
} else {
    Write-Host "  ✗ .env file not found!" -ForegroundColor Red
    Write-Host ""
    
    $createEnv = Read-Host "  Would you like to create the .env file now? (y/n)"
    if ($createEnv -eq "y" -or $createEnv -eq "Y") {
        $apiKey = Read-Host "  Enter your IBM Quantum API key"
        "IBM_QUANTUM_API_KEY=$apiKey" | Out-File -FilePath $envFile -Encoding UTF8
        Write-Host "  ✓ .env file created!" -ForegroundColor Green
    } else {
        Write-Host "  Please create quantum-service\.env manually and run this script again." -ForegroundColor Yellow
        exit 1
    }
}

# Start Docker Compose
Write-Host "`n[3/4] Starting Docker containers..." -ForegroundColor Yellow
Write-Host "  This may take a few minutes on first run..." -ForegroundColor Gray
Write-Host ""

docker-compose up --build -d

if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ All containers started successfully!" -ForegroundColor Green
} else {
    Write-Host "  ✗ Failed to start containers" -ForegroundColor Red
    exit 1
}

# Wait for services to be ready
Write-Host "`n[4/4] Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Check service health
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SERVICE STATUS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$services = @(
    @{Name="Frontend"; URL="http://localhost:3000"},
    @{Name="Backend"; URL="http://localhost:5001/health"},
    @{Name="Quantum Service"; URL="http://localhost:5000/health"}
)

foreach ($service in $services) {
    try {
        $response = Invoke-WebRequest -Uri $service.URL -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
        Write-Host "  ✓ $($service.Name) - Running" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠ $($service.Name) - Starting..." -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  🎉 SETUP COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Access your application at:" -ForegroundColor White
Write-Host "  Frontend:        http://localhost:3000" -ForegroundColor Cyan
Write-Host "  Backend API:     http://localhost:5001" -ForegroundColor Cyan
Write-Host "  Quantum Service: http://localhost:5000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Open http://localhost:3000 in your browser" -ForegroundColor White
Write-Host "  2. Register two users (e.g., Alice and Bob)" -ForegroundColor White
Write-Host "  3. Start chatting with quantum encryption!" -ForegroundColor White
Write-Host ""
Write-Host "View logs:" -ForegroundColor Yellow
Write-Host "  docker-compose logs -f backend" -ForegroundColor Gray
Write-Host ""
Write-Host "Stop services:" -ForegroundColor Yellow
Write-Host "  docker-compose down" -ForegroundColor Gray
Write-Host ""
