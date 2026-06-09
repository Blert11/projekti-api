const express = require('express');
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const booksRoutes = require('./books.routes');
const authorsRoutes = require('./authors.routes');
const categoriesRoutes = require('./categories.routes');
const membersRoutes = require('./members.routes');
const loansRoutes = require('./loans.routes');

const router = express.Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/books', booksRoutes);
router.use('/authors', authorsRoutes);
router.use('/categories', categoriesRoutes);
router.use('/members', membersRoutes);
router.use('/loans', loansRoutes);

module.exports = router;
