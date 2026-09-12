const express = require('express');
const router = express.Router({ mergeParams: true });
const commentController = require('../controllers/commentController');

// POST /api/tickets/:id/comments
router.post('/', commentController.createComment);

// GET /api/tickets/:id/comments
router.get('/', commentController.getCommentsByTicketId);

module.exports = router;
