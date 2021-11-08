import winston from 'winston';

const consoleFormat = winston.format.printf(({level, message, timestamp}) => {
  return `[${timestamp}] [${level.toUpperCase()}] ${message}`
});

const options = {
    file: {
      level: 'debug',
      filename: `../logs/app.log`,
      handleExceptions: true,
      json: true,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      colorize: false,
    },
    console: {
      level: 'debug',
      handleExceptions: true,
      json: false,
      colorize: true,
      format: winston.format.combine(
        winston.format.timestamp(),
        consoleFormat
      )
    },
  };

const logger = winston.createLogger({
    transports: [
        new winston.transports.File(options.file),
        new winston.transports.Console(options.console)
    ],
    exitOnError: false
});

export default logger;