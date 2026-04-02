export const environmentConfig = {
  getDatabaseConfig() {
    return {
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "5432"),
      database: process.env.DB_NAME || "governapi",
      user: process.env.DB_USER || "postgres",
      username: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "postgres123",
      connectionString: process.env.DATABASE_URL,
      maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || "20"),
      connectionTimeoutMs: parseInt(
        process.env.DB_CONNECTION_TIMEOUT || "30000",
      ),
      queryTimeoutMs: parseInt(process.env.DB_QUERY_TIMEOUT || "60000"),
      ssl: process.env.NODE_ENV === "production",
    };
  },
  getConfig() {
    return {
      monitoring: {
        logLevel: process.env.LOG_LEVEL || "info",
        metricsPrefix: "governapi_",
        structuredLogging: true,
        healthCheckIntervalMs: 30000,
        prometheusPort: 9090,
      },
      discovery: {
        maxConcurrentScans: 5,
        passiveMonitoringEnabled: true,
        scanIntervalMs: 60000,
        allowedPorts: [80, 443, 8080, 8443],
        networkTimeoutMs: 5000,
        excludedNetworks: ["127.0.0.0/8", "10.0.0.0/8"],
      },
      security: {
        apiSigningKey: process.env.API_SIGNING_KEY || "default-key",
      },
      policy: {
        cacheExpirationMs: 300000,
        defaultAction: "allow",
      },
    };
  },
  getRedisConfig() {
    return {
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379"),
      password: process.env.REDIS_PASSWORD,
      database: parseInt(process.env.REDIS_DB || "0"),
    };
  },
};
