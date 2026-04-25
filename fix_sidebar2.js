const fs = require('fs');
const f = 'c:/Users/user/Documents/asmamaw/clm/clm/frontend/src/components/common/Sidebar.jsx';
let lines = fs.readFileSync(f, 'utf8').split('\n');

// Replace lines at indices 275-285 (0-based) which are corrupted
const replacement = [
  '',
  '          {',
  "            path: '/technician/schedule', label: 'View Schedule', icon: (",
  '              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">',
  '                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />',
  '              </svg>',
  "            ), color: '#16a085'",
  '          },',
  '          {',
  "            path: '/technician/manage-booking', label: 'Manage Booking', icon: (",
  '              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">',
  '                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />',
  '              </svg>',
  "            ), color: '#8b5cf6'",
  '          },',
  '          {',
  "            path: '/technician/computer-check', label: 'Computer Check', icon: (",
  '              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">',
  '                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />',
  '              </svg>',
  "            ), color: '#dc2626'",
  '          },'
];

const newLines = [
  ...lines.slice(0, 275),
  ...replacement,
  ...lines.slice(286)
];

fs.writeFileSync(f, newLines.join('\n'));
console.log('Sidebar fixed successfully');
