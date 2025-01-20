require('dotenv').config(); // Load .env file
const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();
app.use(express.json());

// Static file serving
app.use(express.static('./'));

// Save forum topics
app.post('/save-topics', async (req, res) => {
  try {
    const topics = req.body;
    await fs.writeFile(
      path.join(__dirname, 'data', 'forum_topics.json'),
      JSON.stringify(topics, null, 2)
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving topics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 5500;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Environment variables
const firebaseApiKey = process.env.FIREBASE_API_KEY;
const youtubeApiKey = process.env.YOUTUBE_API_KEY;

console.log('Firebase API Key:', firebaseApiKey);
console.log('YouTube API Key:', youtubeApiKey);

