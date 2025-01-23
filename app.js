const express = require('express');
const { createClient } = require('redis');

const app = express();
const port = process.env.PORT || 8080;

// configure Redis client
const redisHost = process.env.DB_HOST || '127.0.0.1';
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

app.get('/quote', async (req, res) => {
  try {
    // use SCAN to retrieve all keys matching 'quote:*'
    let cursor = '0';
    let keys = [];
    do {
      const reply = await client.scan(cursor, { MATCH: 'quote:*', COUNT: 100 });
      cursor = reply.cursor;
      keys = keys.concat(reply.keys);
    } while (cursor !== '0');

    if (keys.length === 0) {
      return res.status(404).json({ error: 'No quotes found' });
    }

    // select a random key
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    const quote = await client.hGetAll(randomKey);

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