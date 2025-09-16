const express = require('express');
const router = express.Router();
const UserData = require('../models/UserData');

// router.get('/userdatabase', async (req, res) => {
//   try {
//     const users = await UserData.find();
//     res.json(users);
//   } catch (err) {
//     res.status(500).json({ error: 'Failed to fetch user data' });
//   }
// });
// Helper to get model based on dbName
function getUserModel(dbName) {
  const db = mongoose.connection.useDb(dbName, { useCache: true });
  return db.model('User', userSchema, 'users');
}

// POST: Add user
router.post('/:dbName/users', async (req, res) => {
  try {
    const dbName = req.params.dbName;
    const User = getUserModel(dbName);
    const newUser = new User(req.body);
    await newUser.save();
    res.status(200).json({ message: 'User saved successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error saving user', error: err.message });
  }
});

// GET: All users
router.get('/:dbName/users', async (req, res) => {
  try {
    const dbName = req.params.dbName;
    const User = getUserModel(dbName);
    const users = await User.find();
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching users', error: err.message });
  }
});

module.exports = router;