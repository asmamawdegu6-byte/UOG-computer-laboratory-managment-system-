const fs = require('fs');
const content = fs.readFileSync('backend/controllers/reportController.js', 'utf8');
const lines = content.split('\n');
console.log('Total lines:', lines.length);
console.log('Last 15 lines:');
console.log(lines.slice(-15).join('\n'));
