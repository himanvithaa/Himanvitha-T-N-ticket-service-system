const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const commentRoutes = require('./commentRoutes');

// Nested comment routes: /api/tickets/:id/comments
router.use('/:id/comments', commentRoutes);

// GET /api/tickets - returns all tickets
router.get('/', ticketController.getAllTickets);

// GET /api/tickets/:id - returns one ticket by id
router.get('/:id', ticketController.getTicketById);

// POST /api/tickets - creates a new ticket
router.post('/', ticketController.createTicket);

// PUT /api/tickets/:id - updates a ticket
router.put('/:id', ticketController.updateTicket);

// DELETE /api/tickets/:id - deletes a ticket
router.delete('/:id', ticketController.deleteTicket);

module.exports = router;
