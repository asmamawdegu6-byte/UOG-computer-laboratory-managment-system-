const fs = require('fs');
const f = 'c:/Users/user/Documents/asmamaw/clm/clm/frontend/src/routes/AppRoutes.jsx';
let content = fs.readFileSync(f, 'utf8');

// 1. Add TechComputerCheck import back (it was dropped)
if (!content.includes("import TechComputerCheck from '../pages/technician/TechComputerCheck';")) {
  content = content.replace(
    "import TechViewSchedule from '../pages/technician/TechViewSchedule';",
    "import TechViewSchedule from '../pages/technician/TechViewSchedule';\nimport TechComputerCheck from '../pages/technician/TechComputerCheck';\nimport TechnicianManageBooking from '../pages/technician/TechnicianManageBooking';"
  );
}

// 2. Add the new route
if (!content.includes("path=\"/technician/manage-booking\"")) {
  content = content.replace(
    '<Route path="/technician/computer-check" element={<TechComputerCheck />} />',
    '<Route path="/technician/manage-booking" element={<TechnicianManageBooking />} />\n        <Route path="/technician/computer-check" element={<TechComputerCheck />} />'
  );
}

fs.writeFileSync(f, content);
console.log('Routes fixed successfully');
