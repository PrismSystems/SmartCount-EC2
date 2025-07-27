module.exports = {
  apps: [{
    name: 'smartcount-server',
    script: './server/server.js',
    cwd: '/var/www/smartcount',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
};