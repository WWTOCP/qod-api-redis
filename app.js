const express = require('express');
const { MongoClient } = require('mongodb');
const app = express();
const port = process.env.PORT || 8080;

const dbUser = process.env.DB_USER || 'user';
const dbPass = process.env.DB_PASS || 'pass';
const dbHost = process.env.DB_HOST || 'qod-db';
const dbPort = process.env.DB_PORT || '27017';
const dbName = process.env.DB_NAME || 'qod';

const uri = `mongodb://${dbUser}:${dbPass}@${dbHost}:${dbPort}/${dbName}?authSource=admin`;

async function connectToMongo() {
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  await client.connect();
  const db = client.db(dbName);
  const collection = db.collection('quotes');
  return { client, collection };
}

app.get('/daily', async (req, res) => {
  try {
    const { client, collection } = await connectToMongo();
    const dailyQuote = await collection.findOne({ daily: true });
    await client.close();
    if (dailyQuote) {
      res.json({
        source: 'MongoDB',
        text: dailyQuote.text,
        author: dailyQuote.author,
        genre: dailyQuote.genre
      });
    } else {
      res.status(404).json({ error: 'Daily quote not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching the daily quote' });
  }
});

app.get('/random', async (req, res) => {
  try {
    const { client, collection } = await connectToMongo();
    const count = await collection.countDocuments();
    const randomIndex = Math.floor(Math.random() * count);
    const randomQuote = await collection.find().limit(1).skip(randomIndex).next();
    await client.close();
    if (randomQuote) {
      res.json({
        source: 'MongoDB',
        text: randomQuote.text,
        author: randomQuote.author,
        genre: randomQuote.genre
      });
    } else {
      res.status(404).json({ error: 'No quotes found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching a random quote' });
  }
});

app.get('/version', (req, res) => {
  const { version } = require('./package.json');
  res.json({ version });
});

app.get('/', (req, res) => {
  res.redirect('/version');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});