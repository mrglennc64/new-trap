#!/bin/bash

echo "🔧 Fixing Nginx proxy port configuration"

# Find and update Nginx config files
for conf in /etc/nginx/sites-available/* /etc/nginx/conf.d/*.conf; do
    if [ -f "$conf" ] && grep -q "proxy_pass.*:4000" "$conf"; then
        echo "📝 Updating $conf"
        sudo sed -i 's/:4000/:3006/g' "$conf"
    fi
done

# Test Nginx config
echo -n "✅ Testing Nginx configuration: "
if sudo nginx -t 2>/dev/null; then
    echo "PASSED"
    sudo systemctl reload nginx
    echo "🔄 Nginx reloaded"
else
    echo "FAILED - Check config manually"
    sudo nginx -t
fi

# Start Next.js on port 3006 if not running
if ! curl -s http://localhost:3006 >/dev/null; then
    echo "🚀 Starting Next.js on port 3006..."
    cd /root/traproyalties-new/packages/frontend
    nohup npm run dev > next.log 2>&1 &
    sleep 3
    echo "✅ Next.js started"
else
    echo "✅ Next.js already running on port 3006"
fi

echo -e "\n📋 Testing connection:"
curl -I http://localhost:3006/attorney-portal/pre-release-verify 2>/dev/null | head -n 1

echo -e "\n🌐 Try accessing: https://traproyaltiespro.com/attorney-portal"
