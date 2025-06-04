# Docker Deployment Guide

This guide explains how to deploy the Telegram Audio Player application using Docker.

## Prerequisites

- Docker (version 20.10 or later)
- Docker Compose (version 2.0 or later)

## Quick Start

### Using Docker Compose (Recommended)

1. **Clone the repository and navigate to the project directory**
   ```bash
   git clone <repository-url>
   cd telegram-audio-player
   ```

2. **Configure environment variables**
   ```bash
   cp .env.production .env.production.local
   # Edit .env.production.local with your configuration
   ```

3. **Build and run the application**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - The application will be available at `http://localhost:3000`

### Using Docker directly

1. **Build the Docker image**
   ```bash
   docker build -t telegram-audio-player .
   ```

2. **Run the container**
   ```bash
   docker run -d \
     --name telegram-audio-player \
     -p 3000:3000 \
     --env-file .env.production \
     telegram-audio-player
   ```

## Configuration

### Environment Variables

Configure the following environment variables in `.env.production.local`:

| Variable | Description | Example |
|----------|-------------|---------|
| `TG_ADMIN` | Telegram user ID for admin access | `123456789` |
| `NEXT_PUBLIC_STYLES_BASE_URL` | Base URL for styles (optional) | `https://cdn.example.com/styles` |
| `NEXT_PUBLIC_PLAYLISTS_BASE_URL` | Base URL for playlists (optional) | `https://api.example.com/playlists` |
| `NEXT_PUBLIC_AUDIO_BASE_URL` | Base URL for audio files (optional) | `https://audio-cdn.example.com` |
| `SENTRY_DSN` | Sentry DSN for error tracking (optional) | `https://...@sentry.io/...` |

### Volume Mounts

The Docker Compose configuration includes volume mounts for:

- **Playlists**: `./public/playlists:/app/public/playlists:ro`
- **Styles**: `./public/styles:/app/public/styles:ro`
- **Logs**: `./logs:/app/logs`

This allows you to update playlists and styles without rebuilding the container.

## Production Deployment

### Using a Reverse Proxy

For production deployment, use a reverse proxy like Nginx:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### SSL/HTTPS

For HTTPS, add SSL configuration to your reverse proxy or use a service like Cloudflare.

### Health Checks

The application includes health checks that verify the API is responding:

```bash
# Check container health
docker-compose ps

# View health check logs
docker-compose logs telegram-audio-player
```

## Managing the Application

### Starting/Stopping

```bash
# Start the application
docker-compose up -d

# Stop the application
docker-compose down

# Restart the application
docker-compose restart
```

### Viewing Logs

```bash
# View all logs
docker-compose logs

# Follow logs in real-time
docker-compose logs -f

# View logs for specific time period
docker-compose logs --since="2024-01-01T00:00:00Z"
```

### Updating the Application

1. **Pull latest changes**
   ```bash
   git pull origin main
   ```

2. **Rebuild and restart**
   ```bash
   docker-compose down
   docker-compose build --no-cache
   docker-compose up -d
   ```

### Updating Playlists

Since playlists are mounted as volumes, you can update them without rebuilding:

```bash
# Update playlist files in ./public/playlists/
# The changes will be reflected immediately
```

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Change port in docker-compose.yml
   ports:
     - "3001:3000"  # Use port 3001 instead
   ```

2. **Permission issues with volumes**
   ```bash
   # Ensure proper ownership
   sudo chown -R $USER:$USER ./public/playlists
   sudo chown -R $USER:$USER ./public/styles
   ```

3. **Environment variables not loading**
   ```bash
   # Verify .env.production exists and has correct format
   cat .env.production
   ```

### Debug Mode

To run in debug mode:

```bash
# Set TG_ADMIN=DEBUG in environment
docker-compose exec telegram-audio-player sh
```

## Security Considerations

- Never commit sensitive environment variables to version control
- Use `.env.production.local` for sensitive configuration
- Regularly update the base Docker image and dependencies
- Consider using Docker secrets for sensitive data in production
- Implement proper firewall rules for your deployment

## Monitoring

### Application Metrics

The application exposes the following endpoints for monitoring:

- Health check: `http://localhost:3000/api/config`
- Application status: Available through Docker health checks

### Log Management

Logs are written to `/app/logs` inside the container and can be mounted to the host for analysis.

## Support

For issues related to Docker deployment, check:

1. Docker logs: `docker-compose logs`
2. Application health: `docker-compose ps`
3. Network connectivity: `docker network ls`