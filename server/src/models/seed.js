const fs = require('fs');
const path = require('path');
const { run, get, exec } = require('./database');

const sampleTickets = [
  {
    customerName: 'Alice Johnson',
    title: 'Unable to reset account password',
    description: 'Customer reported that password reset emails are not being delivered to their inbox or spam folder.',
    priority: 'High',
    status: 'Open',
    createdAt: '2026-03-01 09:15:00',
    updatedAt: '2026-03-01 09:15:00'
  },
  {
    customerName: 'Bob Smith',
    title: 'Checkout page crashes on mobile Safari',
    description: 'When attempting to complete purchase on iOS Safari 17, the checkout button freezes and crashes the browser tab.',
    priority: 'High',
    status: 'Open',
    createdAt: '2026-03-02 11:30:00',
    updatedAt: '2026-03-02 11:30:00'
  },
  {
    customerName: 'Charlie Davis',
    title: 'Request for dark mode support',
    description: 'User requested an option to toggle dark theme in user preferences to reduce eye strain during nighttime use.',
    priority: 'Low',
    status: 'In Progress',
    createdAt: '2026-03-03 14:00:00',
    updatedAt: '2026-03-04 10:20:00'
  },
  {
    customerName: 'Diana Prince',
    title: 'Invoice PDF generation contains corrupted characters',
    description: 'Special characters and accented letters in customer names appear as question marks on generated invoices.',
    priority: 'Medium',
    status: 'In Progress',
    createdAt: '2026-03-04 16:45:00',
    updatedAt: '2026-03-05 08:30:00'
  },
  {
    customerName: 'Evan Wright',
    title: 'Two-factor authentication SMS delayed',
    description: 'SMS verification codes take over 10 minutes to arrive, causing authentication tokens to expire.',
    priority: 'High',
    status: 'Resolved',
    createdAt: '2026-03-05 13:10:00',
    updatedAt: '2026-03-06 15:00:00'
  },
  {
    customerName: 'Fiona Gallagher',
    title: 'Update billing address on recurring subscription',
    description: 'Customer relocated and needs help updating their tax jurisdiction and billing address for enterprise billing.',
    priority: 'Medium',
    status: 'Resolved',
    createdAt: '2026-03-06 10:05:00',
    updatedAt: '2026-03-07 11:45:00'
  },
  {
    customerName: 'George Clark',
    title: 'Typo in API documentation quickstart guide',
    description: 'Documentation references endpoint /api/v1/auth instead of /api/v1/authenticate in code sample.',
    priority: 'Low',
    status: 'Closed',
    createdAt: '2026-03-07 12:00:00',
    updatedAt: '2026-03-08 09:30:00'
  },
  {
    customerName: 'Hannah Abbott',
    title: 'Database connection timeouts during peak hours',
    description: 'High latency and connection pool exhaustion observed between 2 PM and 4 PM UTC on analytics reporting.',
    priority: 'Medium',
    status: 'Closed',
    createdAt: '2026-03-08 17:20:00',
    updatedAt: '2026-03-09 14:15:00'
  }
];

/**
 * Seeds the Ticket table with 8 sample tickets if the table is currently empty.
 *
 * @returns {Promise<boolean>} Resolves with true if tickets were seeded, or false if skipped.
 */
async function seed() {
  try {
    // Ensure the database schema is initialized
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await exec(schemaSql);
    }

    // Check if the Ticket table has existing records
    const countResult = await get('SELECT COUNT(*) AS count FROM Ticket');
    const ticketCount = countResult ? countResult.count : 0;

    if (ticketCount > 0) {
      console.log(`Ticket table already contains ${ticketCount} records. Skipping seed.`);
      return false;
    }

    console.log('Ticket table is empty. Inserting 8 sample tickets...');

    const insertSql = `
      INSERT INTO Ticket (customerName, title, description, priority, status, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    for (const ticket of sampleTickets) {
      await run(insertSql, [
        ticket.customerName,
        ticket.title,
        ticket.description,
        ticket.priority,
        ticket.status,
        ticket.createdAt,
        ticket.updatedAt
      ]);
    }

    console.log('Successfully inserted 8 sample tickets into the Ticket table.');
    return true;
  } catch (error) {
    console.error('Error while seeding tickets:', error);
    throw error;
  }
}

// Execute directly if run via CLI (e.g. `node seed.js`)
if (require.main === module) {
  seed()
    .then((seeded) => {
      console.log(seeded ? 'Seed completed successfully.' : 'Seed check completed.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seed execution failed:', err);
      process.exit(1);
    });
}

module.exports = seed;
