const mongoose = require("mongoose");

async function connectDB(url) {
  try {
    await mongoose.connect(url).then(() => {
        console.log("MongoDB connected successfully");
    }).catch((err) => {
        console.log("Error connecting to MongoDB:", err.message);
    });
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    process.exit(1);
  }
}

module.exports = connectDB;
