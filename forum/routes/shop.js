const express = require('express');
const router = express.Router();

app.get('/', (req, res) => {
  res.send('shirt sell');
});

app.get('/', (req, res) => {
  res.send('pants sell');
});

module.exports = router;
