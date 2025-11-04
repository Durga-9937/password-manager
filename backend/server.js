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
 const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+])[A-Za-z\d@$!%*?&#^()_+]{8,}$/;
    if (!strongPasswordRegex.test(password)) {
      return res.status(400).json({
        message:
          'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.',
      });
    }
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

// Function to generate random 6-digit number
function generateRandomCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Function to refresh 6-digit codes every 5 minutes
async function refreshCodes() {
  try {
    const db = await getAdminDb();
    const admins = db.collection(adminsCollection);
    const allUsers = await admins.find({}).toArray();

    for (const user of allUsers) {
      const newCode = generateRandomCode();
      await admins.updateOne(
        { _id: user._id },
        { $set: { resetCode: newCode,  } }
      );
    }
    // console.log('Reset codes updated for all users at', new Date().toLocaleTimeString());
  } catch (err) {
    console.error('Error refreshing codes:', err);
  }
}
// Run every 5 minutes
setInterval(refreshCodes, 5 * 60 * 1000);
refreshCodes();
//  Reset Password Route
app.post('/api/forgot-password', async (req, res) => {
  try {
    const { username, newPassword, secretKey, resetCode } = req.body;

    if (!username || !newPassword || !secretKey || !resetCode) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Connect to admin DB (modify this as per your DB setup)
    const adminDb = await getAdminDb();
    const admins = adminDb.collection(adminsCollection);

    // Find user by email
    const user = await admins.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Validate secret key (_id)
    if (user._id.toString() !== secretKey.trim()) {
      return res.status(401).json({ message: 'Invalid secret key' });
    }
    
    // // Validate reset code
    // if (user.resetCode !== resetCode.trim()) {
    //       return res.status(401).json({ message: 'Invalid 6-digit code' });
    //     }
  // ✅ Ensure reset code matches exactly (string-safe comparison)
    const storedCode = (user.resetCode || '').toString().trim();
    const providedCode = resetCode.toString().trim();

    if (storedCode !== providedCode) {
      return res.status(401).json({ message: 'Invalid 6-digit code' });
    }
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in DB
    await admins.updateOne(
      { _id: new ObjectId(secretKey) },
      { $set: { password: hashedPassword } }
    );

    res.status(200).json({ message: 'Password reset successfully. Please log in again.' });
  } catch (err) {
    console.error('Error in reset-password:', err);
    res.status(500).json({ message: 'Server error during password reset.' });
  }
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
//  Get all users (for admin panel)
app.get('/api/admin', async (req, res) => {
  try {
    const db = await getAdminDb(); // your admin DB
    const admins = db.collection(adminsCollection);

    // Fetch only username and dbName fields (exclude passwords)
    const users = await admins.find({}, { projection: { username: 1, dbName: 1, _id: 0 } }).toArray();

    // Optionally exclude the admin itself
    const filteredUsers = users.filter(user => user.username !== 'admin@gmail.com');

    res.status(200).json(filteredUsers);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: 'Error fetching user list' });
  }
});
app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
