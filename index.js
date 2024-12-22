const express = require('express');
const tracer = require('dd-trace').init({
  logInjection: true, // Automatically inject trace information into logs
});
const winston = require('winston');

const app = express();

// Create a Winston logger instance
const logger = winston.createLogger({
  level: 'info', // Set log level
  format: winston.format.json(), // Use JSON formatting
  transports: [
    new winston.transports.Console(), // Log to console for PM2 to capture
  ],
});

// Replace console.log and console.error with Winston
console.log = (message) => logger.info(message);
console.error = (message) => logger.error(message);

// Middleware to parse JSON payloads
app.use(express.json());

// Routes that trigger various errors
app.get('/error', (req, res, next) => {
  try {
    throw new Error("This is a test error!");
  } catch (err) {
    next(err);
  }
});

app.get('/type-error', (req, res, next) => {
  try {
    const obj = undefined;
    obj.someProperty = "This should fail"; // Causes a TypeError
  } catch (err) {
    next(err);
  }
});

app.get('/reference-error', (req, res, next) => {
  try {
    console.log(notDefined); // Causes a ReferenceError
  } catch (err) {
    next(err);
  }
});

// Error-handling middleware
app.use((err, req, res, next) => {
  logger.error("An error occurred", { error: err }); // Log the error with Winston
  res.status(500).json({ message: err.message, stack: err.stack });
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  logger.info(`Server running on http://localhost:${port}`);
});
