# Ship Tracking - Docker Deployment

## Quick Deployment Guide

### 1. Build Docker Image
```bash
docker build -t ship-tracking .
```

### 2. Run Locally (Test)
```bash
docker run -p 3000:80 ship-tracking
```
Access at: http://localhost:3000

### 3. For Client Deployment

#### Option A: Export/Import Image
```bash
# Export image to file
docker save ship-tracking > ship-tracking.tar

# Send file to client, then on client machine:
docker load < ship-tracking.tar
docker run -p 3000:80 ship-tracking
```

#### Option B: Rebuild on Client
```bash
# Send source code to client, then:
docker build -t ship-tracking .
docker run -p 3000:80 ship-tracking
```

### 4. Change API URL
To use a different API endpoint, modify `src/lib/api.ts`:
```typescript
const apiBaseUrl = 'https://CLIENT_IP:7115'
```
Then rebuild the image.

## Files Included
- `Dockerfile` - Container configuration
- `.dockerignore` - Excludes unnecessary files
- `DEPLOYMENT.md` - This guide

That's it! Simple Docker deployment with minimal configuration.
