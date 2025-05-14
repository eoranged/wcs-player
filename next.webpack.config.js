/**
 * Custom webpack configuration to ignore problematic dependencies
 */
module.exports = {
  webpack: (config, { isServer }) => {
    // Ignore all @opentelemetry instrumentation modules
    if (isServer) {
      config.externals = [
        ...config.externals,
        '@opentelemetry/instrumentation-amqplib',
        '@opentelemetry/instrumentation-dataloader',
        '@opentelemetry/instrumentation-fs',
        '@opentelemetry/instrumentation-graphql',
        '@opentelemetry/instrumentation-http',
        '@opentelemetry/instrumentation-kafkajs',
        '@opentelemetry/instrumentation-koa',
        '@opentelemetry/instrumentation-mongodb',
        '@opentelemetry/instrumentation-mysql',
        '@opentelemetry/instrumentation-pg',
        '@opentelemetry/instrumentation-tedious',
        '@prisma/instrumentation',
      ];
    }
    
    return config;
  },
};
