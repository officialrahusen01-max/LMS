import express from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import * as smartLearningController from '../controllers/smartLearningController.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize(['student', 'admin']));

router.get('/recommendations', smartLearningController.getRecommendations);
router.get('/weak-topics', smartLearningController.getWeakTopics);
router.post('/tutor', smartLearningController.tutor);

export default router;