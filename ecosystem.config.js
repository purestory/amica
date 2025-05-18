module.exports = {
  apps: [
    {
      name: 'amica',
      script: 'npm',
      args: 'run start:prod',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: 'logs/pm2-error.log',
      out_file: 'logs/pm2-out.log',
      merge_logs: true,
      restart_delay: 1000, // 1초 후 재시작
      max_restarts: 10, // 최대 재시작 횟수
      exp_backoff_restart_delay: 100 // 지수 백오프를 사용한 재시작 지연
    },
  ],
}; 