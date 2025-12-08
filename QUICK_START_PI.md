# Quick Start: Raspberry Pi Deployment

## Fastest Way to Deploy

### 1. Build and Package (on your dev machine)
```bash
npm run package:pi
```

This creates `droplet-pi.tar.gz` (~1-2MB)

### 2. Transfer to Raspberry Pi
```bash
scp droplet-pi.tar.gz pi@raspberry-pi:/home/pi/
```

### 3. On Raspberry Pi - Extract and Run
```bash
tar -xzf droplet-pi.tar.gz
cd droplet-pi
python3 server.py
```

### 4. Access Application
Open browser: `http://raspberry-pi-ip:3000`

## That's it! 🎉

For more details, see [DEPLOYMENT_PI.md](./DEPLOYMENT_PI.md)

