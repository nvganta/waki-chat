import { Router } from 'express';
import { alarmController } from '../controllers/alarm.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

router.post('/', alarmController.createAlarm.bind(alarmController));
router.get('/', alarmController.getAlarms.bind(alarmController));
router.get('/:id', alarmController.getAlarm.bind(alarmController));
router.put('/:id', alarmController.updateAlarm.bind(alarmController));
router.delete('/:id', alarmController.deleteAlarm.bind(alarmController));

export default router;