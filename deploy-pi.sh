#!/bin/bash
# Deployment script for Raspberry Pi / Alpine Linux
# This script creates a minimal deployment package

set -e

echo "🚀 Building Droplet for Raspberry Pi..."

# Build optimized production bundle
echo "📦 Building optimized production bundle..."
GENERATE_SOURCEMAP=false INLINE_RUNTIME_CHUNK=false npm run build

# Calculate build size
BUILD_SIZE=$(du -sh build | cut -f1)
echo "✅ Build complete! Size: $BUILD_SIZE"

# Create deployment package
echo "📦 Creating deployment package..."
tar -czf droplet-pi.tar.gz \
  build/ \
  server.js \
  server.py \
  package.json \
  --exclude=node_modules \
  --exclude=.git \
  --exclude='*.log'

PACKAGE_SIZE=$(du -sh droplet-pi.tar.gz | cut -f1)
echo "✅ Package created: droplet-pi.tar.gz ($PACKAGE_SIZE)"

echo ""
echo "📋 Deployment Instructions:"
echo "1. Transfer droplet-pi.tar.gz to your Raspberry Pi:"
echo "   scp droplet-pi.tar.gz user@raspberry-pi:/home/user/"
echo ""
echo "2. On Raspberry Pi, extract and run:"
echo "   tar -xzf droplet-pi.tar.gz"
echo "   python3 server.py"
echo ""
echo "   OR if using Node.js:"
echo "   npm install --production"
echo "   node server.js"
echo ""

