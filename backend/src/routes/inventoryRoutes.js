// Inventory Routes
const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { protect, requireScope } = require('../middleware/auth');
const { validateRequest, validateQuery } = require('../middleware/validation');
const {
  createInventoryItemSchema,
  updateInventoryItemSchema,
  inventoryListQuerySchema
} = require('../validators/inventoryValidator');

router.get('/', protect, requireScope('inventory:read'), validateQuery(inventoryListQuerySchema), inventoryController.getInventoryItems);
router.get('/summary', protect, requireScope('inventory:read'), inventoryController.getInventorySummary);
router.get('/:id', protect, requireScope('inventory:read'), inventoryController.getInventoryItemById);
router.post('/', protect, requireScope('inventory:write'), validateRequest(createInventoryItemSchema), inventoryController.createInventoryItem);
router.put('/:id', protect, requireScope('inventory:write'), validateRequest(updateInventoryItemSchema), inventoryController.updateInventoryItem);
router.delete('/:id', protect, requireScope('inventory:write'), inventoryController.deleteInventoryItem);

module.exports = router;
