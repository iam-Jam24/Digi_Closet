const express = require('express');
const authenticate = require('../middleware/authMiddleware');
const { validate, shoppingPlanSchema } = require('../middleware/validateMiddleware');
const { plan, getSavedLists, deleteList } = require('../controllers/shoppingController');

const router = express.Router();

router.use(authenticate);
router.post('/plan', validate(shoppingPlanSchema), plan);
router.get('/saved', getSavedLists);
router.delete('/saved/:id', deleteList);

module.exports = router;
