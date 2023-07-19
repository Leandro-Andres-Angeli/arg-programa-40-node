const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, './.env') });
const { DATABASE_URL, DATABASE_NAME } = process.env;
const client = new MongoClient(DATABASE_URL);
const connectToMongo = async() => {
    let connection;
    try {
        connection = await client.connect();
    } catch (err) {
        console.log(err.message);
        connection = null;
    }
    return connection;
};
const disconnectFromMongo = async() => {
    try {
        await client.close();
        console.log('desconectado');
    } catch (err) {
        console.log(err.message);
    }
};
const connectToCollection = async(colName) => {
    try {
        const connection = await connectToMongo(colName);
        const db = connection.db(DATABASE_NAME);
        const collection = db.collection(colName);
        return collection;
    } catch (err) {
        console.log(err);
    }
};
module.exports = {connectToCollection, disconnectFromMongo};