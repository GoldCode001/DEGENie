import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 3000;

// API Keys from environment variables
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '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';
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || 'sk_c45cc1bd3b396ca5277a1bc62c005d216140371f44c23f5f';

app.use(cors());
app.use(express.json());
app.use(express.static('dist'));

console.log('🔑 API Keys loaded:', {
  openrouter: OPENROUTER_API_KEY ? 'Present (length: ' + OPENROUTER_API_KEY.length + ')' : 'Missing',
  elevenlabs: ELEVENLABS_API_KEY ? 'Present (length: ' + ELEVENLABS_API_KEY.length + ')' : 'Missing'
});

// OpenRouter proxy
app.post('/api/chat', async (req, res) => {
  try {
    console.log('🤖 Proxying OpenRouter request...');
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    console.log('📡 OpenRouter response:', JSON.stringify(data).substring(0, 200));
    
    if (!response.ok) {
      console.error('❌ OpenRouter API error:', data);
      return res.status(response.status).json(data);
    }
    
    // Check if response has expected structure
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('❌ Unexpected response structure:', data);
      return res.status(500).json({ error: 'Invalid response structure', data });
    }
    
    console.log('✅ OpenRouter response received successfully');
    res.json(data);
  } catch (error) {
    console.error('❌ OpenRouter error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ElevenLabs proxy
app.post('/api/voice', async (req, res) => {
  try {
    console.log('🎤 Proxying ElevenLabs request...');
    
    const { text } = req.body;
    const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/pNInz6obpgDQGcFmaJgB', {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.5,
          use_speaker_boost: true
        }
      })
    });

    console.log('📡 ElevenLabs response status:', response.status);

    if (response.ok) {
      console.log('✅ ElevenLabs audio received');
      const arrayBuffer = await response.arrayBuffer();
      res.set('Content-Type', 'audio/mpeg');
      res.send(Buffer.from(arrayBuffer));
    } else {
      const errorText = await response.text();
      console.error('❌ ElevenLabs error:', response.status, errorText);
      res.status(response.status).json({ error: 'ElevenLabs API error', details: errorText });
    }
  } catch (error) {
    console.error('❌ Voice error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile('index.html', { root: 'dist' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
