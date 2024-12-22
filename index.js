const express = require('express');
const app = express();
const tracer = require('dd-trace').init({
  logInjection: true
});

// Middleware to parse JSON payloads if needed
app.use(express.json());

app.use((err, req, res, next) => {
  console.error({
      message: err.message,
      stack: err.stack,
      trace_id: tracer.scope().active()?.context()?.toTraceId(),
      span_id: tracer.scope().active()?.context()?.toSpanId(),
  });

  res.status(500).json({ message: err.message });
});

// A route that triggers a generic error
app.get('/error', (req, res, next) => {
  try {
    throw new Error("This is a test error!");
  } catch (err) {
    // The error will be passed down to the error-handling middleware
    next(err);
  }
});

// A route that triggers a runtime TypeError (e.g., calling a method on undefined)
app.get('/type-error', (req, res, next) => {
  try {
    const obj = undefined;
    // This will cause a TypeError
    obj.someProperty = "This should fail";
  } catch (err) {
    next(err);
  }
});

// Another route that triggers a reference error (using an undefined variable)
app.get('/reference-error', (req, res, next) => {
  try {
    // Attempting to use an undeclared variable 'notDefined' will cause a ReferenceError
    console.log(notDefined);
  } catch (err) {
    next(err);
  }
});

// Error-handling middleware
// This middleware will catch errors and print them out.
// Datadog and other APM tools can capture these stack traces.
app.use((err, req, res, next) => {
  console.error("An error occurred:", err);
  // Include stack trace in response for testing; 
  // In production, you might want to omit or sanitize this.
  res.status(500).json({ message: err.message, stack: err.stack });
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
