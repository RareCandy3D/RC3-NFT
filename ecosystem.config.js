module.exports = {
  apps: [
    {
      name: "Production",
      script: "./scripts/index.js",
      watch: true,
      ignore_watch: ["uploads", "log", "node_modules"],
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
