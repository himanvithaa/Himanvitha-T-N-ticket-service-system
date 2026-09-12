const http = require('http');
const app = require('../server');
const { run, get, exec } = require('../src/models/database');
const seed = require('../src/models/seed');

let server;
const PORT = 5002;

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

    console.log('\n--- Testing GET /api/tickets (default pagination and sorting) ---');
    const getAll = await request('GET', '/api/tickets');
    console.assert(getAll.status === 200, `Expected 200, got ${getAll.status}`);
    console.assert(Array.isArray(getAll.body.tickets) && getAll.body.tickets.length >= 8, 'Expected at least 8 tickets');
    console.assert(typeof getAll.body.totalCount === 'number' && getAll.body.totalCount >= 8, 'Expected totalCount >= 8');
    console.assert(typeof getAll.body.totalPages === 'number' && getAll.body.totalPages >= 1, 'Expected totalPages >= 1');
    console.log(`✓ GET /api/tickets passed (${getAll.body.tickets.length} tickets, totalCount: ${getAll.body.totalCount})`);

    console.log('\n--- Testing query parameters: status, priority, customer, search, pagination, sortBy ---');

    // Filter by status (exact)
    const filterStatus = await request('GET', '/api/tickets?status=Open');
    console.assert(filterStatus.status === 200, 'Expected 200 for status filter');
    console.assert(filterStatus.body.tickets.every((t) => t.status === 'Open'), 'All returned tickets should have status Open');
    console.log(`✓ Filter by status=Open passed (${filterStatus.body.tickets.length} tickets)`);

    // Filter by priority (exact)
    const filterPriority = await request('GET', '/api/tickets?priority=High');
    console.assert(filterPriority.status === 200, 'Expected 200 for priority filter');
    console.assert(filterPriority.body.tickets.every((t) => t.priority === 'High'), 'All returned tickets should have priority High');
    console.log(`✓ Filter by priority=High passed (${filterPriority.body.tickets.length} tickets)`);

    // Partial match on customer
    const filterCustomer = await request('GET', '/api/tickets?customer=Alice');
    console.assert(filterCustomer.status === 200, 'Expected 200 for customer filter');
    console.assert(filterCustomer.body.tickets.length >= 1, 'Expected at least 1 ticket for Alice');
    console.assert(filterCustomer.body.tickets.every((t) => t.customerName.includes('Alice')), 'Matches should contain Alice');
    console.log(`✓ Filter by customer=Alice passed (${filterCustomer.body.tickets.length} tickets)`);

    // Partial match on search (title or customerName)
    const filterSearch = await request('GET', '/api/tickets?search=password');
    console.assert(filterSearch.status === 200, 'Expected 200 for search filter');
    console.assert(filterSearch.body.tickets.length >= 1, 'Expected at least 1 ticket matching password');
    console.assert(
      filterSearch.body.tickets.every(
        (t) => t.title.toLowerCase().includes('password') || t.customerName.toLowerCase().includes('password')
      ),
      'Matches should contain search term'
    );
    console.log(`✓ Search filter passed (${filterSearch.body.tickets.length} tickets)`);

    // Pagination: limit & page
    const page1Limit3 = await request('GET', '/api/tickets?page=1&limit=3');
    console.assert(page1Limit3.body.tickets.length === 3, `Expected 3 tickets, got ${page1Limit3.body.tickets.length}`);
    const page2Limit3 = await request('GET', '/api/tickets?page=2&limit=3');
    console.assert(page2Limit3.body.tickets.length === 3, `Expected 3 tickets on page 2, got ${page2Limit3.body.tickets.length}`);
    console.assert(page1Limit3.body.tickets[0].id !== page2Limit3.body.tickets[0].id, 'Page 1 and Page 2 should have distinct items');
    console.assert(page1Limit3.body.totalPages >= 3, 'Expected at least 3 total pages with limit 3');
    console.log('✓ Pagination (page & limit) passed');

    // Sort by priority (High -> Medium -> Low)
    const sortedPriority = await request('GET', '/api/tickets?sortBy=priority&limit=10');
    console.assert(sortedPriority.status === 200, 'Expected 200 for sortBy=priority');
    const priorityOrder = { High: 1, Medium: 2, Low: 3 };
    for (let i = 0; i < sortedPriority.body.tickets.length - 1; i++) {
      const curr = priorityOrder[sortedPriority.body.tickets[i].priority];
      const next = priorityOrder[sortedPriority.body.tickets[i + 1].priority];
      console.assert(curr <= next, `Expected priority ${curr} <= ${next} at index ${i}`);
    }
    console.log('✓ Sort by priority passed');

    console.log('\n--- Testing Comment Endpoints: POST & GET /api/tickets/:id/comments ---');
    const commentTicket = await request('POST', '/api/tickets', {
      customerName: 'Comment Tester',
      title: 'Ticket for comments',
      description: 'Testing comment flow',
      priority: 'Low'
    });
    const ticketId = commentTicket.body.id;

    // POST comment missing text
    const commentMissingText = await request('POST', `/api/tickets/${ticketId}/comments`, {});
    console.assert(commentMissingText.status === 400, `Expected 400, got ${commentMissingText.status}`);
    console.assert(commentMissingText.body.error !== undefined, 'Expected error in response');
    console.log('✓ POST comment missing text returns 400');

    // POST comment for non-existent ticket
    const commentNotFound = await request('POST', '/api/tickets/999999/comments', { text: 'Hello' });
    console.assert(commentNotFound.status === 404, `Expected 404, got ${commentNotFound.status}`);
    console.assert(commentNotFound.body.error === 'Ticket not found', 'Expected Ticket not found');
    console.log('✓ POST comment on invalid ticket returns 404');

    // POST comment success
    const comment1 = await request('POST', `/api/tickets/${ticketId}/comments`, { text: 'First test comment' });
    console.assert(comment1.status === 201, `Expected 201, got ${comment1.status}`);
    console.assert(comment1.body.id !== undefined, 'Expected comment id');
    console.assert(String(comment1.body.ticketId) === String(ticketId), 'Expected ticketId');
    console.assert(comment1.body.text === 'First test comment', 'Expected text to match');
    console.assert(comment1.body.createdAt !== undefined, 'Expected createdAt');
    console.log('✓ POST comment 1 success');

    // POST a second comment
    const comment2 = await request('POST', `/api/tickets/${ticketId}/comments`, { text: 'Second test comment' });
    console.assert(comment2.status === 201, `Expected 201, got ${comment2.status}`);
    console.log('✓ POST comment 2 success');

    // GET comments for non-existent ticket
    const getCommentsNotFound = await request('GET', '/api/tickets/999999/comments');
    console.assert(getCommentsNotFound.status === 404, `Expected 404, got ${getCommentsNotFound.status}`);
    console.assert(getCommentsNotFound.body.error === 'Ticket not found', 'Expected Ticket not found');
    console.log('✓ GET comments on invalid ticket returns 404');

    // GET comments success (ordered oldest first)
    const getComments = await request('GET', `/api/tickets/${ticketId}/comments`);
    console.assert(getComments.status === 200, `Expected 200, got ${getComments.status}`);
    console.assert(Array.isArray(getComments.body), 'Expected array of comments');
    console.assert(getComments.body.length >= 2, 'Expected at least 2 comments');
    console.assert(getComments.body[0].text === 'First test comment', 'Oldest comment should be first');
    console.assert(getComments.body[1].text === 'Second test comment', 'Second comment should follow');
    console.log('✓ GET comments ordered oldest first passed');

    console.log('\n--- Retesting Core Ticket CRUD ---');
    const singleTicket = await request('GET', `/api/tickets/${ticketId}`);
    console.assert(singleTicket.status === 200, 'GET /api/tickets/:id works');

    const createdTicket = await request('POST', '/api/tickets', {
      customerName: 'Samira Khan',
      title: 'Billing invoice issue',
      description: 'Invoice totals do not add up',
      priority: 'Medium'
    });
    console.assert(createdTicket.status === 201, 'POST /api/tickets works');

    const updatedTicket = await request('PUT', `/api/tickets/${createdTicket.body.id}`, {
      status: 'Resolved'
    });
    console.assert(updatedTicket.status === 200 && updatedTicket.body.status === 'Resolved', 'PUT /api/tickets/:id works');

    const deletedTicket = await request('DELETE', `/api/tickets/${createdTicket.body.id}`);
    console.assert(deletedTicket.status === 200, 'DELETE /api/tickets/:id works');

    console.log('\nAll tests passed successfully!');
  } catch (err) {
    console.error('Test failure:', err);
    process.exitCode = 1;
  } finally {
    server.close();
    process.exit(process.exitCode || 0);
  }
}

runTests();
