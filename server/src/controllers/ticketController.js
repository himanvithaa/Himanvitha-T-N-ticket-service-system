const { run, get, all } = require('../models/database');

const ALLOWED_PRIORITIES = ['Low', 'Medium', 'High'];
const ALLOWED_STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed'];

/**
 * GET /api/tickets
 * Returns tickets from the database with optional query parameters:
 * - status (exact match)
 * - priority (exact match)
 * - customer (partial match on customerName)
 * - search (partial match on either title or customerName)
 * - page & limit (pagination, default page 1 and limit 10)
 * - sortBy (accepts 'createdAt' or 'priority', default createdAt newest first)
 */
async function getAllTickets(req, res, next) {
  try {
    const { status, priority, customer, search, page, limit, sortBy } = req.query;

    const whereClauses = [];
    const params = [];

    // status: exact match
    if (status) {
      whereClauses.push('status = ?');
      params.push(status);
    }

    // priority: exact match
    if (priority) {
      whereClauses.push('priority = ?');
      params.push(priority);
    }

    // customer: partial match on customerName
    if (customer) {
      whereClauses.push('customerName LIKE ?');
      params.push(`%${customer}%`);
    }

    // search: partial match on either title or customerName
    if (search) {
      whereClauses.push('(title LIKE ? OR customerName LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Calculate total count of matching tickets
    const countSql = `SELECT COUNT(*) AS count FROM Ticket ${whereSql}`;
    const countResult = await get(countSql, params);
    const totalCount = countResult ? countResult.count : 0;

    // sortBy: accepts 'createdAt' or 'priority', default createdAt, newest first
    let orderSql = 'ORDER BY createdAt DESC';
    if (sortBy === 'priority') {
      orderSql = "ORDER BY CASE priority WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 WHEN 'Low' THEN 3 ELSE 4 END ASC, createdAt DESC";
    }

    // page and limit: default page 1 and limit 10
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const safePage = !isNaN(pageNum) && pageNum > 0 ? pageNum : 1;
    const safeLimit = !isNaN(limitNum) && limitNum > 0 ? limitNum : 10;
    const offset = (safePage - 1) * safeLimit;
    const totalPages = Math.max(1, Math.ceil(totalCount / safeLimit));

    const sql = `SELECT * FROM Ticket ${whereSql} ${orderSql} LIMIT ? OFFSET ?`;
    const queryParams = [...params, safeLimit, offset];

    const tickets = await all(sql, queryParams);

    return res.status(200).json({
      tickets,
      totalCount,
      totalPages
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/tickets/:id
 * Returns one ticket by id.
 * If no ticket with that id exists, returns status 404 with { "error": "Ticket not found" }.
 */
async function getTicketById(req, res, next) {
  try {
    const { id } = req.params;
    const ticket = await get('SELECT * FROM Ticket WHERE id = ?', [id]);

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    return res.status(200).json(ticket);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/tickets
 * Creates a new ticket.
 * Requires customerName, title, description, and priority.
 * If missing, returns 400 with { "error": "<field> is required" }.
 * If priority is invalid, returns 400 with { "error": "priority must be Low, Medium, or High" }.
 * On success, returns status 201 with the full created ticket.
 */
async function createTicket(req, res, next) {
  try {
    const requiredFields = ['customerName', 'title', 'description', 'priority'];

    for (const field of requiredFields) {
      const val = req.body[field];
      if (val === undefined || val === null || (typeof val === 'string' && val.trim() === '')) {
        return res.status(400).json({ error: `${field} is required` });
      }
    }

    const { customerName, title, description, priority, status } = req.body;

    if (!ALLOWED_PRIORITIES.includes(priority)) {
      return res.status(400).json({ error: 'priority must be Low, Medium, or High' });
    }

    let ticketStatus = 'Open';
    if (status !== undefined) {
      if (!ALLOWED_STATUSES.includes(status)) {
        return res.status(400).json({ error: 'status must be Open, In Progress, Resolved, or Closed' });
      }
      ticketStatus = status;
    }

    const insertSql = `
      INSERT INTO Ticket (customerName, title, description, priority, status)
      VALUES (?, ?, ?, ?, ?)
    `;

    const result = await run(insertSql, [
      typeof customerName === 'string' ? customerName.trim() : customerName,
      typeof title === 'string' ? title.trim() : title,
      typeof description === 'string' ? description.trim() : description,
      priority,
      ticketStatus
    ]);

    const createdTicket = await get('SELECT * FROM Ticket WHERE id = ?', [result.id]);

    return res.status(201).json(createdTicket);
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/tickets/:id
 * Updates a ticket.
 * Accepts any of customerName, title, description, priority, status.
 * Validates status and priority if provided.
 * Returns 404 if the id doesn't exist.
 * Automatically updates updatedAt and returns the full updated ticket.
 */
async function updateTicket(req, res, next) {
  try {
    const { id } = req.params;
    const existingTicket = await get('SELECT * FROM Ticket WHERE id = ?', [id]);

    if (!existingTicket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const { customerName, title, description, priority, status } = req.body;

    if (priority !== undefined && !ALLOWED_PRIORITIES.includes(priority)) {
      return res.status(400).json({ error: 'priority must be Low, Medium, or High' });
    }

    if (status !== undefined && !ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'status must be Open, In Progress, Resolved, or Closed' });
    }

    const updateFields = [];
    const values = [];

    if (customerName !== undefined) {
      updateFields.push('customerName = ?');
      values.push(typeof customerName === 'string' ? customerName.trim() : customerName);
    }
    if (title !== undefined) {
      updateFields.push('title = ?');
      values.push(typeof title === 'string' ? title.trim() : title);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      values.push(typeof description === 'string' ? description.trim() : description);
    }
    if (priority !== undefined) {
      updateFields.push('priority = ?');
      values.push(priority);
    }
    if (status !== undefined) {
      updateFields.push('status = ?');
      values.push(status);
    }

    // Always update updatedAt to current time
    updateFields.push("updatedAt = datetime('now')");
    values.push(id);

    const updateSql = `UPDATE Ticket SET ${updateFields.join(', ')} WHERE id = ?`;
    await run(updateSql, values);

    const updatedTicket = await get('SELECT * FROM Ticket WHERE id = ?', [id]);

    return res.status(200).json(updatedTicket);
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/tickets/:id
 * Deletes a ticket by id.
 * Returns 404 if the id doesn't exist.
 * On success returns status 200 with { "message": "Ticket deleted" }.
 */
async function deleteTicket(req, res, next) {
  try {
    const { id } = req.params;
    const existingTicket = await get('SELECT * FROM Ticket WHERE id = ?', [id]);

    if (!existingTicket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    await run('DELETE FROM Ticket WHERE id = ?', [id]);

    return res.status(200).json({ message: 'Ticket deleted' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllTickets,
  getTicketById,
  createTicket,
  updateTicket,
  deleteTicket
};
