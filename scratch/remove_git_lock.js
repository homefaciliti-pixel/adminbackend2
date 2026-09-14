const fs = require('fs');
const lockPath = 'D:\\admin_panel\\backend\\.git\\index.lock';
if (fs.existsSync(lockPath)) {
  fs.unlinkSync(lockPath);
  console.log('Successfully deleted backend git index.lock');
} else {
  console.log('No lock file found.');
}
