const http = require('http');
const app = require('../server');
const { run, exec } = require('../src/models/database');
const seed = require('../src/models/seed');

let server;
const PORT = 5001;

function request(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : null;
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: PORT,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
        }
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(body);
          } catch (e) {
            parsed = body;
          }
          resolve({ status: res.statusCode, body: parsed });
        });
      }
    );
    req.on('error', reject);
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

async function runTests() {
  server = app.listen(PORT);
  console.log(`Test server running on port ${PORT}`);

  try {
    // Ensure seed is executed
    await seed();

    console.log('\n--- Testing GET /api/tickets ---');
    const getAll = await request('GET', '/api/tickets');
    console.assert(getAll.status === 200, `Expected 200, got ${getAll.status}`);
    console.assert(Array.isArray(getAll.body) && getAll.body.length >= 8, 'Expected at least 8 tickets');
    console.log('✓ GET /api/tickets passed');

    console.log('\n--- Testing GET /api/tickets/:id ---');
    const getOne = await request('GET', `/api/tickets/${getAll.body[0].id}`);
    console.assert(getOne.status === 200, `Expected 200, got ${getOne.status}`);
    console.assert(getOne.body.id === getAll.body[0].id, 'Ticket ID mismatch');

    const getNotFound = await request('GET', '/api/tickets/999999');
    console.assert(getNotFound.status === 404, `Expected 404, got ${getNotFound.status}`);
    console.assert(getNotFound.body.error === 'Ticket not found', 'Expected Ticket not found error');
    console.log('✓ GET /api/tickets/:id passed');

    console.log('\n--- Testing POST /api/tickets validation ---');
    const missingName = await request('POST', '/api/tickets', {
      title: 'Bug',
      description: 'Desc',
      priority: 'High'
    });
    console.assert(missingName.status === 400, `Expected 400, got ${missingName.status}`);
    console.assert(missingName.body.error === 'customerName is required', `Expected customerName error, got: ${missingName.body.error}`);

    const missingTitle = await request('POST', '/api/tickets', {
      customerName: 'John',
      description: 'Desc',
      priority: 'High'
    });
    console.assert(missingTitle.status === 400, `Expected 400, got ${missingTitle.status}`);
    console.assert(missingTitle.body.error === 'title is required', `Expected title error, got: ${missingTitle.body.error}`);

    const invalidPriority = await request('POST', '/api/tickets', {
      customerName: 'John',
      title: 'Bug',
      description: 'Desc',
      priority: 'Urgent'
    });
    console.assert(invalidPriority.status === 400, `Expected 400, got ${invalidPriority.status}`);
    console.assert(invalidPriority.body.error === 'priority must be Low, Medium, or High', 'Expected priority validation error');

    console.log('\n--- Testing POST /api/tickets success ---');
    const created = await request('POST', '/api/tickets', {
      customerName: 'Test Customer',
      title: 'Test Issue',
      description: 'Test Description',
      priority: 'Low'
    });
    console.assert(created.status === 201, `Expected 201, got ${created.status}`);
    console.assert(created.body.id !== undefined, 'Expected created ticket to have id');
    console.assert(created.body.createdAt !== undefined, 'Expected createdAt');
    console.assert(created.body.updatedAt !== undefined, 'Expected updatedAt');
    console.assert(created.body.status === 'Open', 'Expected default status Open');
    const newId = created.body.id;
    console.log('✓ POST /api/tickets passed');

    console.log('\n--- Testing PUT /api/tickets/:id ---');
    const updateInvalidStatus = await request('PUT', `/api/tickets/${newId}`, {
      status: 'InvalidStatus'
    });
    console.assert(updateInvalidStatus.status === 400, `Expected 400, got ${updateInvalidStatus.status}`);

    const updateInvalidPriority = await request('PUT', `/api/tickets/${newId}`, {
      priority: 'SuperHigh'
    });
    console.assert(updateInvalidPriority.status === 400, `Expected 400, got ${updateInvalidPriority.status}`);

    const updateNotFound = await request('PUT', '/api/tickets/999999', {
      status: 'Resolved'
    });
    console.assert(updateNotFound.status === 404, `Expected 404, got ${updateNotFound.status}`);
    console.assert(updateNotFound.body.error === 'Ticket not found', 'Expected 404 error');

    const updateSuccess = await request('PUT', `/api/tickets/${newId}`, {
      status: 'In Progress',
      priority: 'High'
    });
    console.assert(updateSuccess.status === 200, `Expected 200, got ${updateSuccess.status}`);
    console.assert(updateSuccess.body.status === 'In Progress', 'Expected status In Progress');
    console.assert(updateSuccess.body.priority === 'High', 'Expected priority High');
    console.log('✓ PUT /api/tickets/:id passed');

    console.log('\n--- Testing DELETE /api/tickets/:id ---');
    const deleteNotFound = await request('DELETE', '/api/tickets/999999');
    console.assert(deleteNotFound.status === 404, `Expected 404, got ${deleteNotFound.status}`);
    console.assert(deleteNotFound.body.error === 'Ticket not found', 'Expected 404 error');

    const deleteSuccess = await request('DELETE', `/api/tickets/${newId}`);
    console.assert(deleteSuccess.status === 200, `Expected 200, got ${deleteSuccess.status}`);
    console.assert(deleteSuccess.body.message === 'Ticket deleted', 'Expected Ticket deleted message');

    const getAfterDelete = await request('GET', `/api/tickets/${newId}`);
    console.assert(getAfterDelete.status === 404, 'Expected deleted ticket to be 404');
    console.log('✓ DELETE /api/tickets/:id passed');

    console.log('\nAll tests completed successfully!');
  } catch (err) {
    console.error('Test failure:', err);
    process.exitCode = 1;
  } finally {
    server.close();
    process.exit(process.exitCode || 0);
  }
}

runTests();
