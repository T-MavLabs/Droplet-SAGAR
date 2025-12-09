# Droplet Deployment for Raspberry Pi / Alpine Linux

This guide explains how to deploy Droplet on a Raspberry Pi running Alpine Linux with minimal size.

## Prerequisites

- Raspberry Pi (any model)
- Alpine Linux installed
- Python 3.x OR Node.js (for server)
- Network connection

## Build Options

### Option 1: Build on Development Machine (Recommended)


1. **Build optimized bundle:**
   ```bash
   npm run build:pi
   ```
   This creates an optimized build with:
   - No source maps (smaller size)
   - Inline runtime chunk disabled
   - Production optimizations

2. **Create deployment package:**
   ```bash
   npm run package:pi
   ```
   This creates `droplet-pi.tar.gz` containing:
   - `build/` - Optimized React app
   - `server.js` - Node.js server
   - `server.py` - Python server (alternative)
   - `package.json` - Dependencies list

3. **Transfer to Raspberry Pi:**
   ```bash
   scp droplet-pi.tar.gz user@raspberry-pi:/home/user/
   ```

### Option 2: Use Deployment Script

```bash
chmod +x deploy-pi.sh
./deploy-pi.sh
```

This will:
- Build optimized production bundle
- Create deployment package
- Show transfer instructions

## Deployment on Raspberry Pi

### Method 1: Python Server (Lightweight - Recommended)

1. **Extract package:**
   ```bash
   tar -xzf droplet-pi.tar.gz
   cd droplet-pi
   ```

2. **Make server executable:**
   ```bash
   chmod +x server.py
   ```

3. **Run server:**
   ```bash
   python3 server.py
   ```

4. **Access application:**
   Open browser to `http://raspberry-pi-ip:3000`

### Method 2: Node.js Server

1. **Extract package:**
   ```bash
   tar -xzf droplet-pi.tar.gz
   cd droplet-pi
   ```

2. **Install production dependencies only:**
   ```bash
   npm install --production --no-optional
   ```

3. **Run server:**
   ```bash
   node server.js
   ```

### Method 3: Lighttpd (Most Lightweight)

1. **Install lighttpd:**
   ```bash
   apk add lighttpd
   ```

2. **Extract and copy files:**
   ```bash
   tar -xzf droplet-pi.tar.gz
   cp -r build/* /var/www/localhost/htdocs/
   ```

3. **Configure lighttpd:**
   ```bash
   echo 'server.document-root = "/var/www/localhost/htdocs"' >> /etc/lighttpd/lighttpd.conf
   echo 'server.port = 3000' >> /etc/lighttpd/lighttpd.conf
   ```

4. **Start lighttpd:**
   ```bash
   rc-service lighttpd start
   rc-update add lighttpd default
   ```

## Running as a Service

### Systemd Service (if using systemd)

Create `/etc/systemd/system/droplet.service`:

```ini
[Unit]
Description=Droplet Data Entry Application
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/droplet
ExecStart=/usr/bin/python3 /home/pi/droplet/server.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable droplet
sudo systemctl start droplet
```

### OpenRC Service (Alpine Linux)

Create `/etc/init.d/droplet`:

```bash
#!/sbin/openrc-run

name="Droplet"
command="/usr/bin/python3"
command_args="/home/pi/droplet/server.py"
command_user="pi"
pidfile="/var/run/droplet.pid"
```

Make executable and add to default runlevel:
```bash
chmod +x /etc/init.d/droplet
rc-update add droplet default
rc-service droplet start
```

## Kiosk Mode Setup

To run in fullscreen kiosk mode on boot:

1. **Install Chromium:**
   ```bash
   apk add chromium
   ```

2. **Create autostart script:**
   ```bash
   mkdir -p ~/.config/autostart
   cat > ~/.config/autostart/droplet.desktop << EOF
   [Desktop Entry]
   Type=Application
   Name=Droplet
   Exec=chromium --kiosk --app=http://localhost:3000
   EOF
   ```

## Size Optimization

The optimized build typically results in:
- **Build folder:** ~500KB - 1MB (gzipped)
- **Total package:** ~1-2MB (with server files)
- **With Node.js dependencies:** ~50-100MB (if using Node.js server)
- **Python server only:** ~1-2MB (no additional dependencies)

## Troubleshooting

### Port Already in Use
Change port in `server.js` or `server.py`:
```javascript
const PORT = process.env.PORT || 8080;
```

### Build Fails
Make sure all dependencies are installed:
```bash
npm install
```

### Server Won't Start
Check if build directory exists:
```bash
ls -la build/
```

### Browser Can't Connect
- Check firewall: `iptables -L`
- Verify server is running: `ps aux | grep server`
- Check port: `netstat -tuln | grep 3000`

## Network Access

To access from other devices on the network:

1. **Find Raspberry Pi IP:**
   ```bash
   hostname -I
   ```

2. **Access from other device:**
   ```
   http://raspberry-pi-ip:3000
   ```

## Performance Tips

1. **Use Python server** for smallest footprint
2. **Disable source maps** in production (already done in build:pi)
3. **Use lighttpd** for best performance with static files
4. **Enable gzip compression** in lighttpd config
5. **Cache static assets** for faster loading

## Security Notes

- Change default port if needed
- Use firewall rules to restrict access
- Consider HTTPS for production (requires SSL certificate)
- Run server as non-root user

