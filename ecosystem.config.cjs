/** @type {import("pm2").EcosystemConfig} */
module.exports = {
  apps: [
    {
      name: "exam-mate",
      cwd: __dirname,
      script: "node_modules/next/dist/bin/next",
      args: "start",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
        HOSTNAME: "0.0.0.0",
        PORT: 8096,
      },
    },
  ],
};
