const mongoose = require('mongoose');

const userDataSchema = new mongoose.Schema({
  username: String,
  password: String,
  comments: String
}, { versionKey: false });

module.exports = userSchema;