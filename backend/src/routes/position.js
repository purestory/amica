const express = require('express');
const router = express.Router();
const positionController = require('../controllers/positionController');

// GET /api/position - 현재 위치 설정 조회
router.get('/', positionController.getPosition);

// POST /api/position - 위치 설정 저장
router.post('/', positionController.savePosition);

// PUT /api/position/reset - 위치 설정 초기화
router.put('/reset', positionController.resetPosition);

// GET /api/position/default - 기본 위치 설정 조회
router.get('/default', positionController.getDefaultPosition);

// GET /api/position/models - 사용 가능한 VRM 모델 목록 조회
router.get('/models', positionController.getAvailableModels);

// GET /api/position/backgrounds - 사용 가능한 배경 이미지 목록 조회
router.get('/backgrounds', positionController.getAvailableBackgrounds);

module.exports = router; 