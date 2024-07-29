const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();
app.use(express.json());

// Serve static files from the current directory
app.use(express.static('./'));

// Endpoint to save forum topics
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
