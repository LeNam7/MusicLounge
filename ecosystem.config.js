module.exports = {
  apps: [
    {
      name: 'lung-vai-tea',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        PORT: 3000,
        NODE_ENV: 'production',
        NODE_NO_WARNINGS: '1',
      },
    },
  ],
};
