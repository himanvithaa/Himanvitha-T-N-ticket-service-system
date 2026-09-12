const { run, get, all } = require('../models/database');

/**
 * POST /api/tickets/:id/comments
 * Requires text in request body, returns 400 if missing.
 * Returns 404 if ticket id doesn't exist.
 * Inserts comment and returns 201 with created comment (id, ticketId, text, createdAt).
 */
async function createComment(req, res, next) {
  try {
    const ticketId = req.params.id;
    const { text } = req.body;

    if (text === undefined || text === null || (typeof text === 'string' && text.trim() === '')) {
      return res.status(400).json({ error: 'text is required' });
    }

    // Check if the ticket exists
    const ticket = await get('SELECT * FROM Ticket WHERE id = ?', [ticketId]);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const insertSql = `
      INSERT INTO Comment (ticketId, text)
      VALUES (?, ?)
    `;

    const result = await run(insertSql, [
      ticketId,
      typeof text === 'string' ? text.trim() : text
    ]);

    const createdComment = await get('SELECT * FROM Comment WHERE id = ?', [result.id]);

    return res.status(201).json(createdComment);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/tickets/:id/comments
 * Returns 404 if the ticket doesn't exist.
 * Returns all comments for that ticket as an array, ordered oldest first.
 */
async function getCommentsByTicketId(req, res, next) {
  try {
    const ticketId = req.params.id;

    // Check if the ticket exists
    const ticket = await get('SELECT * FROM Ticket WHERE id = ?', [ticketId]);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const comments = await all(
      'SELECT * FROM Comment WHERE ticketId = ? ORDER BY createdAt ASC, id ASC',
      [ticketId]
    );

    return res.status(200).json(comments || []);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createComment,
  getCommentsByTicketId
};
