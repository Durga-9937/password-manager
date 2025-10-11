const express = require('express');
const bcrypt = require('bcryptjs');
const { MongoClient } = require('mongodb');
const { ObjectId } = require('mongodb');
const app = express();
const port = 3000;
const cors = require('cors');
const session = require('express-session');


//middleware
app.use(cors());
app.use(express.json());

app.use(session({
  secret: 'mySecretKey123',
  resave: false,
  saveUninitialized: true,
}));
// MongoDB connection URL
const mongoUri = 'mongodb://localhost:27017';
const client = new MongoClient(mongoUri);

// Central Admin DB
const adminDbName = 'passwordmanager';
const adminsCollection = 'admins';

// Get connection to central admin DB
async function getAdminDb() {
  await client.connect();
  return client.db(adminDbName);
}
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
// SIGNUP Route: Creates admin & new DB
app.post('/api/signup', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password)
      return res.status(400).json({ message: 'Email and password are required' });

    if (!isValidEmail(username))
      return res.status(400).json({ message: 'Invalid email format' });

    const adminDb = await getAdminDb();
    const admins = adminDb.collection(adminsCollection);

    const existing = await admins.findOne({ username });
    if (existing)
      return res.status(400).json({ message: 'Admin already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);

    //  sanitize email for DB name
    const dbName = `userdatabase_${username.replace(/[@.]/g, '_')}`;

    // Save admin info
    await admins.insertOne({ username, password: hashedPassword, dbName });

    //  Create per-admin database and a starter collection
    const userDb = client.db(dbName);
    await userDb.createCollection('users'); // starter collection

    res.status(201).json({ message: `Admin created with DB: ${dbName}` });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Server error during signup' });
  }
});

//  LOGIN Route
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  if (!isValidEmail(username)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  const adminDb = await getAdminDb();
  const admins = adminDb.collection(adminsCollection);

  const admin = await admins.findOne({ username });
  if (!admin)
    return res.status(400).json({ message: 'Invalid username or password' });

  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch)
    return res.status(400).json({ message: 'Invalid username or password' });
  req.session.admin = admin.username;
  res.json({ message: 'Login successful', dbName: admin.dbName });
});

app.get('/api/:dbName/users', async (req, res) => {
  const { dbName } = req.params;
  const db = client.db(dbName);
  const usersCollection = db.collection('users');

  try {
    const users = await usersCollection.find().toArray();
    res.json(users);
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

app.post('/api/:dbName/users', async (req, res) => {
  const { dbName } = req.params;
  const { username, password, comments } = req.body;

  if (!username || !password || !comments) {
    return res.status(400).json({ message: 'Username and password and comments are required' });
  }

  const db = client.db(dbName);
  const users = db.collection('users');

  try {
    await users.insertOne({ username, password, comments });
    res.status(201).json({ message: 'User added' });
  } catch (err) {
    res.status(500).json({ message: 'Error adding user' });
  }
});
app.delete('/api/:dbName/users/:id', async (req, res) => {
  const { dbName, id } = req.params;

  try {
    const db = client.db(dbName); // Dynamically select DB
    const usersCollection = db.collection('users');

    const result = await usersCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete Error:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});
app.put('/api/:dbName/users/:id', async (req, res) => {
  const { dbName, id } = req.params;
  const updatedData = req.body;

  try {
    const db = client.db(dbName);
    const usersCollection = db.collection('users');

    const result = await usersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Update Error:', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
