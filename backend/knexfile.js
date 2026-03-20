require("dotenv").config();

module.exports = {
  development: {
    client: "mysql2",
    connection: {
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "readify_dev",
      port: process.env.DB_PORT || 3306,
    },
    migrations: {
      directory: "./migrations",
      extension: "js",
      stub: "./migration.stub",
    },
    seeds: {
      directory: "./seeds",
      extension: "js",
    },
  },

  staging: {
    client: "mysql2",
    connection: {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306,
    },
    migrations: {
      directory: "./migrations",
      extension: "js",
    },
    seeds: {
      directory: "./seeds",
      extension: "js",
    },
  },

  production: {
    client: "mysql2",
    connection: {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306,
    },
    migrations: {
      directory: "./migrations",
      extension: "js",
    },
    seeds: {
      directory: "./seeds",
      extension: "js",
    },
  },
};
