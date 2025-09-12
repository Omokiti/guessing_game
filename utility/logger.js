import { createLogger, transports, format } from 'winston';

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.printf(({ level, message, timestamp }) => {
      return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    })
  ),
  transports: [
    new transports.Console(), // show logs in terminal
    new transports.File({ filename: 'logs/error.log', level: 'error' }), // errors saved to file
    new transports.File({ filename: 'logs/combined.log' }), // all logs
  ],
});

export default logger;
