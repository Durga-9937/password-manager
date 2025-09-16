const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const admin = await Admin.findOne({ username });
  if (!admin) return res.status(400).json({ message: 'User not found' });

  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

  res.status(200).json({ message: 'Login successful' });
   // ✅ Return dbName
  res.json({ message: 'Login successful', dbName: admin.dbName });
});
module.exports = router;