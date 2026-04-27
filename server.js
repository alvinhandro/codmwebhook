require('dotenv').config();
const express = require('express');
const axios = require('axios');
const morgan = require('morgan');

const app = express();
app.use(express.json());
app.use(morgan('dev'));

const PORT = process.env.PORT || 3000;

const webhooks = {
  live: process.env.WEBHOOK_LIVE,
  match: process.env.WEBHOOK_MATCH,
  clips: process.env.WEBHOOK_CLIPS,
  tournaments: process.env.WEBHOOK_TOURNAMENTS
};

// Health check
app.get('/', (req, res) => {
  res.send('CODM Webhook System Running 🚀');
});

// Live Alert
app.post('/live', async (req, res) => {
  const { title, url } = req.body;
  try {
    await axios.post(webhooks.live, {
      embeds: [{
        title: "🔴 Alvin is LIVE on CODM!",
        description: `[Watch Now](${url})\n${title}`,
        color: 16711680
      }]
    });
    res.send("Live alert sent");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Match Result
app.post('/match', async (req, res) => {
  const { player, kills, result } = req.body;
  try {
    await axios.post(webhooks.match, {
      embeds: [{
        title: "🎯 Match Result",
        description: `👤 ${player}\n💀 Kills: ${kills}\n🏆 Result: ${result}`,
        color: 3447003
      }]
    });
    res.send("Match logged");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Clip
app.post('/clip', async (req, res) => {
  const { title, clipUrl } = req.body;
  try {
    await axios.post(webhooks.clips, {
      embeds: [{
        title: "🔥 New CODM Clip",
        description: `[Watch Clip](${clipUrl})\n${title}`,
        color: 16753920
      }]
    });
    res.send("Clip posted");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Tournament
app.post('/tournament', async (req, res) => {
  const { name, date } = req.body;
  try {
    await axios.post(webhooks.tournaments, {
      embeds: [{
        title: "🏆 Tournament Alert",
        description: `${name}\n📅 ${date}`,
        color: 10181046
      }]
    });
    res.send("Tournament alert sent");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
