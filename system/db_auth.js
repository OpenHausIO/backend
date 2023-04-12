const { MongoClient } = require('mongodb');

const url = process.env.DATABASE_URL;

const client = new MongoClient(url);

async function run() {
    try {
        await client.connect();
        // Perform database operations
    } catch (err) {
        console.error(err);
    } finally {
        await client.close();
    }
}

run();
