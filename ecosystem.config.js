module.exports = {
  apps: [{
    name: 'governapi-dashboard',
    script: 'npm',
    args: 'start',
    cwd: './apps/dashboard',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
