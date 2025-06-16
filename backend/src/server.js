const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3101;

// 미들웨어 설정
app.use(cors({
  origin: ['http://localhost:5173', 'https://ai-open.kr'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 라우트 설정
app.use('/api/position', require('./routes/position'));

// 기본 라우트
app.get('/', (req, res) => {
  res.json({
    message: 'Amica Backend API Server',
    version: '1.0.0',
    port: PORT,
    endpoints: [
      'GET /api/position - 위치 설정 조회',
      'POST /api/position - 위치 설정 저장',
      'PUT /api/position/reset - 위치 설정 초기화'
    ]
  });
});

// 에러 핸들링
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// 404 핸들링
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 Amica Backend Server running on port ${PORT}`);
  console.log(`📍 Server URL: http://localhost:${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
}); 