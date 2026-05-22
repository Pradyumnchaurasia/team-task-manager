const express = require('express');
const { getUsers, updateUserRole } = require('../controllers/userController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/', getUsers);
router.put('/:id/role', isAdmin, updateUserRole);

module.exports = router;
