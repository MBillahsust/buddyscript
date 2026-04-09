import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { env } from './environment';

const rotateOptions = {
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
};

export const logger = winston.createLogger({
  level: env.nodeEnv === 'development' ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'buddy-script-api' },
  transports: [
    new DailyRotateFile({ ...rotateOptions, filename: 'logs/error-%DATE%.log', level: 'error' }),
    new DailyRotateFile({ ...rotateOptions, filename: 'logs/combined-%DATE%.log' }),
  ],
});

// In development: log to console with colors
if (env.nodeEnv !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}
