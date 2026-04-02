#!/bin/bash
echo "=== AUTOMATED SECURITY SCAN ==="

# Check for secrets in code
echo "Scanning for potential secrets..."
grep -r "password.*=" src/ --include="*.ts" | grep -v "process.env" && echo "WARNING: Potential hardcoded secrets"

# Check npm dependencies
echo "Checking dependencies..."
npm audit --audit-level=moderate

echo "Security scan completed"
