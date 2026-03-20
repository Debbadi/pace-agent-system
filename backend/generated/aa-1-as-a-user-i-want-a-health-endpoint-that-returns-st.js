// Generated: 2026-03-20T01:03:01.679Z
```javascript
const express = require('express');
const app = express();

module.exports = (app) => {
  app.get('/health', (req, res) => {
    res.status(200).send({ status: 'ok' });
  });
};
```

Note that I've added the app parameter to allow for customization of the Express app instance before exporting it.