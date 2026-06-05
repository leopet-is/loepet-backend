#!/bin/bash
cd /tmp
npm install bcrypt --silent 2>/dev/null
node -e "const bcrypt=require('/tmp/node_modules/bcrypt'); bcrypt.hash('Leopet2025!',10).then(h=>console.log(h))"
