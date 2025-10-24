// Minimal backend pour My-Tube
// Endpoints:
// GET /api/search?q=...   -> retourne liste de vidéos (id, title, duration, thumbnail)
// GET /api/stream?videoId=... [&download=1] -> stream audio (ytdl-core)
// Static files: sert les fichiers frontend (index.html, assets/...)
// Attention: respecter la légalité lors de l'utilisation.

const express = require('express');
const path = require('path');
const ytsr = require('ytsr');
const ytdl = require('ytdl-core');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const PORT = process.env.PORT || 3000;
const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Rate limiting basic
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // max 30 requests per IP per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Serve static frontend (assume repo root contains index.html and assets/)
app.use(express.static(path.join(__dirname, '..')));

// Helper to extract videoId from ytsr item url
function extractVideoId(url) {
  try {
    const u = new URL(url);
    return u.searchParams.get('v');
  } catch (e) {
    return null;
  }
}

// API: search
app.get('/api/search', async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.status(400).json({ error: 'Missing query q' });

  try {
    const searchResults = await ytsr(q, { limit: 30 });
    const items = (searchResults.items || [])
      .filter(i => i.type === 'video')
      .slice(0, 16)
      .map(i => {
        const id = extractVideoId(i.url) || i.id || '';
        return {
          id,
          title: i.title,
          duration: i.duration,
          thumbnail: (i.bestThumbnail && i.bestThumbnail.url) || (i.thumbnails && i.thumbnails[0] && i.thumbnails[0].url) || '',
          author: i.author && i.author.name ? i.author.name : ''
        };
      });
    res.json(items);
  } catch (err) {
    console.error('Search error', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

// API: stream (audio)
app.get('/api/stream', async (req, res) => {
  const videoId = req.query.videoId;
  const download = req.query.download === '1' || req.query.download === 'true';
  if (!videoId) return res.status(400).send('Missing videoId');

  try {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    // Verify video exists and get info
    const info = await ytdl.getInfo(videoUrl);
    const format = ytdl.chooseFormat(info.formats, { quality: 'highestaudio' });

    // Set headers
    const contentType = format.mimeType ? format.mimeType.split(';')[0] : 'audio/mpeg';
    res.setHeader('Content-Type', contentType);

    const safeTitle = info.videoDetails && info.videoDetails.title ? info.videoDetails.title.replace(/["']/g, '') : videoId;
    if (download) {
      res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.mp3"`);
    } else {
      // Let browser treat as media stream
      res.setHeader('Accept-Ranges', 'bytes');
    }

    // If format provides contentLength, expose it to help clients with seeking
    if (format.contentLength) {
      res.setHeader('Content-Length', format.contentLength);
    }

    // Stream audio using ytdl (audio only)
    const stream = ytdl(videoUrl, {
      filter: 'audioonly',
      quality: 'highestaudio',
      highWaterMark: 1 << 25, // 32 MB buffer
    });

    stream.on('error', (err) => {
      console.error('ytdl stream error', err);
      if (!res.headersSent) res.status(500).send('Streaming error');
      stream.destroy();
    });

    stream.pipe(res);
  } catch (err) {
    console.error('Stream error', err);
    if (!res.headersSent) res.status(500).send('Could not stream');
  }
});

// Fallback to index.html for SPA routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
