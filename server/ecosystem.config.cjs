module.exports = {
  apps: [{
    name: 'chisha-server',
    cwd: '/www/chisha/chi-sha/server',
    script: './index.ts',
    interpreter: 'tsx',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env_production: {
      NODE_ENV: 'production'
    }
  }]
}