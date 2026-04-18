#!/usr/bin/env bash
# SCM Backend - Khởi động nhanh
# Chạy: bash start.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DB="$SCRIPT_DIR/scm.db"

echo "🚀 SCM Backend - Khởi động..."

# Tạo database nếu chưa có
if [ ! -f "$DB" ]; then
    echo "📦 Tạo database lần đầu..."
    python3 "$SCRIPT_DIR/init_db.py"
fi

echo "✅ Database OK"
echo "🌐 Khởi động server tại http://localhost:8000 ..."
python3 "$SCRIPT_DIR/server.py"
