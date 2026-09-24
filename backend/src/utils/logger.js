const logger = {
  info: (msg, meta = {}) => {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify({ level: 'info', msg, ...meta, timestamp: new Date().toISOString() }));
  },
  error: (msg, meta = {}) => {
    // eslint-disable-next-line no-console
    console.error(JSON.stringify({ level: 'error', msg, ...meta, timestamp: new Date().toISOString() }));
  },
  warn: (msg, meta = {}) => {
    // eslint-disable-next-line no-console
    console.warn(JSON.stringify({ level: 'warn', msg, ...meta, timestamp: new Date().toISOString() }));
  },
};

module.exports = logger;
