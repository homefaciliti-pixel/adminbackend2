const express = require('express');
const bodyParser = require('body-parser');
const db = require('../db.js');

// We will mock req and res to run the route handler directly.
// Let's load the partners router.
const partnersRouter = require('../routes/partners.js');

// Let's construct a mock req and res
const req = {
  params: { id: '10000377' },
  body: {
    name: 'Abhay pratap changed',
    email: 'Kunalmudiya@Gmail.com',
    mobile: '+916375781820',
    address: '201',
    gender: 'male',
    experience: '1',
    bankName: 'Bank of baroda',
    accountNumber: '2967001700032054',
    ifscCode: 'PUNB0296700'
  },
  headers: {
    host: 'localhost:5000'
  },
  get: function(header) {
    if (header === 'host') return 'localhost:5000';
    return null;
  },
  protocol: 'http'
};

const res = {
  status: function(code) {
    this.statusCode = code;
    return this;
  },
  json: function(data) {
    console.log('Response status:', this.statusCode || 200);
    console.log('Response JSON:', JSON.stringify(data, null, 2));
  }
};

async function test() {
  try {
    // Find the PUT route handler in the router stack
    const route = partnersRouter.stack.find(s => s.route && s.route.path === '/:id' && s.route.methods.put);
    if (!route) {
      console.log('PUT /:id route not found in partners router!');
      process.exit(1);
    }
    
    console.log('Executing PUT /:id handler...');
    const handler = route.route.stack[0].handle;
    await handler(req, res);
    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

test();
