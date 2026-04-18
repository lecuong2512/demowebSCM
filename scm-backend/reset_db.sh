#!/usr/bin/env bash
# Reset database về dữ liệu ban đầu
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "⚠️  Xóa và tạo lại database..."
python3 "$SCRIPT_DIR/init_db.py"
echo "✅ Database đã được reset!"
