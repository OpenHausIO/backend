const { MongoClient } = require('mongodb');

const url = 'mongodb://<user>:<pass>:27017/OpenHaus';
// process.env.DATABASE_URL

const client = new MongoClient(url);

async function checkAuth() {
  try {
    await client.connect();
    // console.log('Connected to MongoDB server');
    // Perform database operations
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

module.exports = checkAuth;
