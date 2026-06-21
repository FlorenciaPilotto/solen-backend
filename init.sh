#!/usr/bin/env bash
set -e

echo "=== Solen Harness — Verificación ==="

# 1. TypeScript sin errores
echo "[1/2] Verificando TypeScript..."
cd solen-mobile
npx tsc --noEmit
cd ..
echo "      ✓ TypeScript OK"

# 2. Coherencia de feature_list.json
echo "[2/2] Verificando feature_list.json..."
IN_PROGRESS=$(python3 -c "
import json, sys
data = json.load(open('feature_list.json'))
count = sum(1 for f in data if f.get('status') == 'in_progress')
print(count)
" 2>/dev/null || node -e "
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('feature_list.json','utf8'));
const count = data.filter(f => f.status === 'in_progress').length;
console.log(count);
")
if [ "$IN_PROGRESS" -gt 1 ]; then
  echo "      ✗ ERROR: más de una feature en in_progress ($IN_PROGRESS)"
  exit 1
fi
echo "      ✓ feature_list.json coherente ($IN_PROGRESS en progreso)"

echo ""
echo "=== ✓ Todo verde ==="
