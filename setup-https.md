# HTTPS Setup with Caddy and Self-Signed Certificates

This guide helps you set up HTTPS on port 443 for your ETD application using Caddy as a reverse proxy with automatically generated self-signed certificates.

## Prerequisites

1. **Install Caddy** (if running locally without Docker):
   ```bash
   # Windows (using chocolatey)
   choco install caddy
   
   # Or download from: https://caddyserver.com/download
   ```

## Setup Options

### Option 1: Using Docker (Recommended)

1. **Start the application with HTTPS**:
   ```bash
   docker-compose up --build
   ```

2. **Access your application**:
   - HTTPS: https://localhost (port 443)
   - HTTP redirect: http://localhost (redirects to HTTPS)

### Option 2: Local Development (without Docker)

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start Next.js application**:
   ```bash
   npm run dev:https
   ```

3. **In another terminal, start Caddy**:
   ```bash
   caddy run --config Caddyfile.local
   ```

4. **Or use the combined script**:
   ```bash
   npm run dev:caddy
   ```

## How It Works

1. **Caddy** listens on ports 80 (HTTP) and 443 (HTTPS)
2. **SSL Certificates** are automatically generated using Caddy's internal CA
3. **Next.js** continues to run on port 3000
4. **Caddy** proxies all requests from port 443 to your Next.js app on port 3000
5. **HTTP requests** are automatically redirected to HTTPS

## Accessing Your Application

- **Main URL**: https://localhost
- **Alternative**: https://127.0.0.1

## Browser Security Warning

Since we're using self-signed certificates, your browser will show a security warning. This is normal for development. To proceed:

1. Click "Advanced" or "Show Details"
2. Click "Proceed to localhost (unsafe)" or similar
3. Your browser will remember this choice for the session

## Files Created

- `Caddyfile` - Configuration for Docker environment
- `Caddyfile.local` - Configuration for local development
- `setup-https.md` - This instruction file

## Troubleshooting

### Port 443 in use
```bash
# Windows: Check what's using port 443
netstat -ano | findstr :443

# Stop the process if needed
taskkill /PID <process_id> /F
```

### Caddy not starting
- Make sure you're running as administrator (Windows) or with sudo (Linux/Mac)
- Port 443 requires elevated privileges

### Application not accessible
- Check if Next.js is running on port 3000
- Verify Caddy is proxying correctly by checking the logs

## Production Notes

For production deployment:
1. Use a real domain name
2. Remove `tls internal` from Caddyfile
3. Let Caddy automatically obtain real SSL certificates from Let's Encrypt
4. Update security headers as needed
