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
    const recycleCollection = db.collection('deleted_users');

    // Find the user to delete
    const deletedUser = await usersCollection.findOne({ _id: new ObjectId(id) });

    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Insert into recycle bin
    await recycleCollection.insertOne({
      ...deletedUser,
      deletedAt: new Date()
    });

    // Remove from main users collection
    await usersCollection.deleteOne({ _id: new ObjectId(id) });

    res.status(200).json({ message: 'User moved to recycle bin successfully' });

  } catch (error) {
    console.error(' Delete Error:', error);
    res.status(500).json({ message: 'Failed to move user to recycle bin' });
  }
});
//  GET Deleted Users (Recycle Bin)
app.get('/api/:dbName/deleted_users', async (req, res) => {
  const { dbName } = req.params;

  try {
    const db = client.db(dbName);
    const recycleCollection = db.collection('deleted_users');

    const deletedUsers = await recycleCollection
      .find({})
      .sort({ deletedAt: -1 }) // optional: newest first
      .toArray();

    res.status(200).json(deletedUsers);
  } catch (error) {
    console.error('Error fetching deleted users:', error);
    res.status(500).json({ message: 'Failed to fetch deleted users' });
  }
});
// RESTORE Deleted User
app.post('/api/:dbName/restore/:id', async (req, res) => {
  const { dbName, id } = req.params;

  try {
    const db = client.db(dbName);
    const recycleCollection = db.collection('deleted_users');
    const usersCollection = db.collection('users');

    // Find user in recycle bin
    const deletedUser = await recycleCollection.findOne({ _id: new ObjectId(id) });
    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found in recycle bin' });
    }

    // Remove _id to avoid conflict when inserting into users
    const { _id, deletedAt, ...userData } = deletedUser;

    // Insert back into users
    await usersCollection.insertOne(userData);

    // Remove from recycle bin
    await recycleCollection.deleteOne({ _id: new ObjectId(id) });

    res.status(200).json({ message: 'User restored successfully' });
  } catch (error) {
    console.error('Restore Error:', error);
    res.status(500).json({ message: 'Failed to restore user' });
  }
});
// PERMANENTLY DELETE User from recycle bin
app.delete('/api/:dbName/deleted_users/:id', async (req, res) => {
  const { dbName, id } = req.params;

  try {
    const db = client.db(dbName);
    const recycleCollection = db.collection('deleted_users');

    const result = await recycleCollection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'User not found in recycle bin' });
    }

    res.status(200).json({ message: 'User permanently deleted' });
  } catch (error) {
    console.error('Permanent Delete Error:', error);
    res.status(500).json({ message: 'Failed to permanently delete user' });
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
