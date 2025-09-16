import { Router } from 'express';
import { vapiController } from '../controllers/vapi.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Protected routes
router.post('/web-call', authMiddleware, vapiController.createWebCall);
router.post('/phone-call', authMiddleware, vapiController.createPhoneCall);
router.post('/end/:callId', authMiddleware, vapiController.endCall);
router.get('/transcript/:callId', authMiddleware, vapiController.getTranscript);

// Webhook endpoint (public)
router.post('/webhook', vapiController.handleWebhook);

export default router;