const express = require('express');
const path = require('path');
const app = express();
const PORT = 8080;

// Serve the compiled Flutter Web build (located two levels up under build/web)
const webPath = path.join(__dirname, '..', '..', 'build', 'web');
app.use(express.static(webPath));

// For routing support (HTML5 History API)
app.get('*', (req, res) => {
  res.sendFile(path.join(webPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Local Admin Panel server is running!`);
  console.log(`🔗 Open in your browser: http://localhost:${PORT}`);
});
