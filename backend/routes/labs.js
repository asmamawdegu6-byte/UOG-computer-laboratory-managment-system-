const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const labController = require('../controllers/labController');

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array().map(e => e.msg) });
    }
    next();
};

router.get('/', labController.getAllLabs);
router.get('/:id', labController.getLabById);
router.get('/:id/workstations', labController.getWorkstations);
router.get('/:id/availability', labController.getAvailability);

router.post('/', authenticate, authorize('admin', 'superadmin'), [
    body('name').trim().notEmpty(),
    body('code').trim().notEmpty(),
    body('capacity').isInt({ min: 1 }),
    validate
], labController.createLab);

router.put('/:id', authenticate, authorize('admin', 'superadmin'), labController.updateLab);
router.delete('/:id', authenticate, authorize('admin', 'superadmin'), labController.deleteLab);

module.exports = router;
