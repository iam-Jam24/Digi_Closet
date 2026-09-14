const express = require('express');
const { getItems, addItem, deleteItem } = require('../controllers/wardrobeController');
const authenticate = require('../middleware/authMiddleware');
const { validate, wardrobeSchema } = require('../middleware/validateMiddleware');

const router = express.Router();

router.use(authenticate);

router.get('/', getItems);
router.post('/', validate(wardrobeSchema), addItem);
router.delete('/:id', deleteItem);

module.exports = router;
