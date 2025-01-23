const express = require('express');
const { createClient } = require('redis');

const app = express();
const port = process.env.PORT || 8080;

// configure Redis client
const redisHost = process.env.DB_HOST || 'qod-db';
const redisUrl = `redis://${redisHost}:6379`;
const client = createClient({ url: redisUrl });

client.on('error', (err) => console.error('Redis Client Error', err));

// connect to Redis
async function connectRedis() {
  try {
    await client.connect();
    console.log('Connected to Redis');
  } catch (err) {
    console.error('Failed to connect to Redis', err);
  }
}

connectRedis();

app.use(express.json());

function dailyQuoteId(){
  // assumes the order of the database is random and day of year corresponds to quote id
  var now = new Date();
  var start = new Date(now.getFullYear(), 0, 0);
  var diff = (now - start) + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
  var oneDay = 1000 * 60 * 60 * 24;
  var day = Math.floor(diff / oneDay);
  return day;
}

app.get('/daily', async (req, res) => {
  try {
    var quote_id = dailyQuoteId();
    const key = `quote:${quote_id}`;
    const quote = await client.hGetAll(key);

    if (Object.keys(quote).length === 0) {
      return res.status(404).json({ error: 'Daily quote not found' });
    }

    res.json({
      source: 'Redis',
      text: quote.text,
      author: quote.author,
      genre: quote.genre,
    });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching the daily quote' });
  }
});

app.get('/random', async (req, res) => {
  try {
    // select a random key
    var random_id = Math.floor(Math.random() * 500);
    const key = `quote:${random_id}`;
    const quote = await client.hGetAll(randomKey);

    if (keys.length === 0) {
      return res.status(404).json({ error: 'No quotes found' });
    }

    res.json({
      source: 'Redis',
      text: quote.text,
      author: quote.author,
      genre: quote.genre,
    });
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