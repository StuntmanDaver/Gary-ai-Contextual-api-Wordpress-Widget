# Infrastructure Design Notes

## API Credentials
- Contextual AI API Key: `key-dODB6wQ_8CcXFQYoLLZX-BhrOHc2KidTu6y73PrewFOQDaCP4`
- Agent ID: `1ef70a2a-1405-4ba5-9c27-62de4b263e20`
- Datastore ID: `6f01eb92-f12a-4113-a39f-3c4013303482`

## Development Environment Setup

### Local Development Server
```bash
cd "C:\Users\davidk\Documents\Projects\SQL Data Query system\src\API"
$env:ASPNETCORE_ENVIRONMENT='Development'
dotnet run --urls=http://localhost:5050
```

### API Testing
```bash
Invoke-WebRequest -Uri http://localhost:5050/api/NaturalLanguageQuery/execute -Method POST -Body '{"Query":"Show all devices","ExportAsJson":true}' -ContentType "application/json" -Headers @{Authorization = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZXZ1c2VyIiwicm9sZSI6IkFkbWluIiwiaXNzIjoiU1FMRGF0YVF1ZXJ5U3lzdGVtIiwiYXVkIjoiU1FMRGF0YVF1ZXJ5U3lzdGVtIiwiZXhwIjoxNzY2MDgzMjAwfQ.Sa8mVJdz_S44_qtZNMfuN-rGtZxTSOczX0M3DSV-j-w'}
```

## Security Notes
- Store API keys in `wp-config.php` or environment variables
- Never commit credentials to version control
- Use WordPress nonces for client-side authentication
- Implement proper rate limiting and input validation

## Deployment Considerations
- Ensure all API keys are properly configured in production
- Test all endpoints before deployment
- Monitor API usage and rate limits
- Implement proper error handling and logging
