const { MongoClient } = require('mongodb');

async function checkAuth(username) {
    const databaseName = 'mydatabase';
    const uri = `mongodb://${process.env.DATABASE_USERNAME}:${process.env.DATABASE_PASSWORD}@localhost:27017/OpenHaus`;
    const client = new MongoClient(uri, { useNewUrlParser: true });

    try {
        await client.connect();
        console.log('Connected to MongoDB server');

        // Query the database for the specified username
        const db = client.db();
        const users = db.collection('users');
        const user = await users.findOne({ username });

        // Check if the user exists and has a password
        if (user && user.password) {
            return true;
        } else {
            return false;
        }
    } catch (err) {
        console.error(err);
        return false;
    } finally {
        await client.close();
    }
}

module.exports = checkAuth;
// Example usage: checkAuth('myusername')
