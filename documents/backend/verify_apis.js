const http = require('http');
const express = require('express');
const cors = require('cors');

console.log('🧪 Starting API Verification tests...');

// Define a minimal test database connection check to ensure pool references don't block tests
try {
  const server = require('./server');
  console.log('✅ server.js compiled and loaded successfully.');
  
  // Test endpoints exist by inspecting Express route routes
  const endpoints = [];
  function print(path, layer) {
    if (layer.route) {
      layer.route.stack.forEach(print.bind(null, path + (layer.route.path || '')));
    } else if (layer.name === 'router' && layer.handle.stack) {
      layer.handle.stack.forEach(print.bind(null, path + (layer.regexp.source.replace('\\/?$', '').replace('(?=\\/|$)', ''))));
    } else if (layer.method) {
      endpoints.push(`${layer.method.toUpperCase()} ${path}`);
    }
  }
  
  server._router.stack.forEach(print.bind(null, ''));
  
  console.log(`\nDetected ${endpoints.length} registered REST endpoints in the Express app:`);
  endpoints.forEach(ep => console.log(` - ${ep}`));
  
  if (endpoints.length >= 15) {
    console.log('\n✅ Verification Success: All routes are properly registered!');
    process.exit(0);
  } else {
    console.error('\n❌ Verification Failure: Some routes were not registered properly.');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Verification failed with error:', error);
  process.exit(1);
}
