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

// Function to preprocess text for better TTS
function preprocessForTTS(text) {
  let ttsText = text;
  
  // MASSIVE abbreviation expansion list
  const abbreviations = {
    // Crypto
    'btc': 'bitcoin',
    'eth': 'ethereum', 
    'sol': 'solana',
    'bnb': 'binance coin',
    'ada': 'cardano',
    'dot': 'polkadot',
    'matic': 'polygon',
    'avax': 'avalanche',
    'link': 'chainlink',
    'atom': 'cosmos',
    'xrp': 'ripple',
    'doge': 'dogecoin',
    'shib': 'shiba inu',
    'uni': 'uniswap',
    'aave': 'ah-vay',
    'ftx': 'f t x',
    'nft': 'n f t',
    'nfts': 'n f ts',
    'defi': 'dee-fie',
    'dao': 'd a o',
    'dapp': 'dap',
    'dapps': 'daps',
    'gm': 'good morning',
    'gn': 'good night',
    'ngmi': 'not gonna make it',
    'wagmi': 'we are all gonna make it',
    'fomo': 'foe-moe',
    'hodl': 'hold',
    'hodling': 'holding',
    'rekt': 'wrecked',
    'wen': 'when',
    'ser': 'sir',
    'anon': 'anonymous',
    'degen': 'degenerate',
    'degens': 'degenerates',
    'hopium': 'hope-ium',
    'copium': 'cope-ium',
    'ath': 'all time high',
    'atl': 'all time low',
    'mcap': 'market cap',
    'roi': 'r o i',
    'apy': 'a p y',
    'apr': 'a p r',
    'kyc': 'k y c',
    'aml': 'a m l',
    'ico': 'i c o',
    'ido': 'i d o',
    'ieo': 'i e o',
    'dex': 'decks',
    'cex': 'centralized exchange',
    'p2p': 'peer to peer',
    'pow': 'proof of work',
    'pos': 'proof of stake',
    'nfa': 'not financial advice',
    'dyor': 'do your own research',
    
    // Internet/Texting slang
    'imo': 'in my opinion',
    'imho': 'in my humble opinion',
    'afaik': 'as far as i know',
    'iirc': 'if i recall correctly',
    'tl;dr': 'too long didnt read',
    'tldr': 'too long didnt read',
    'nsfw': 'not safe for work',
    'sfw': 'safe for work',
    'dm': 'direct message',
    'dms': 'direct messages',
    'irl': 'in real life',
    'ama': 'ask me anything',
    'eli5': 'explain like im five',
    'ftw': 'for the win',
    'goat': 'greatest of all time',
    'og': 'original',
    'op': 'original poster',
    'rn': 'right now',
    'asap': 'as soon as possible',
    'fyi': 'for your information',
    'psa': 'public service announcement',
    'eta': 'estimated time of arrival',
    'btw': 'by the way',
    'gg': 'good game',
    'wp': 'well played',
    'mvp': 'most valuable player',
    'aka': 'also known as',
    'vs': 'versus',
    'etc': 'et cetera',
    'ie': 'that is',
    'eg': 'for example',
    
    // Common texting
    'u': 'you',
    'ur': 'your',
    'ppl': 'people',
    'msg': 'message',
    'thx': 'thanks',
    'plz': 'please',
    'sry': 'sorry',
    'np': 'no problem',
    'jk': 'just kidding',
    'yk': 'you know',
    'rly': 'really',
    'prob': 'probably',
    'def': 'definitely',
    'obv': 'obviously',
    'tho': 'though',
    'w/': 'with',
    'w/o': 'without',
    'b4': 'before',
    'l8r': 'later',
    'tmr': 'tomorrow',
    '2day': 'today',
    'tn': 'tonight'
  };
  
  // Replace abbreviations (case insensitive, word boundaries)
  Object.keys(abbreviations).forEach(abbr => {
    const regex = new RegExp(`\\b${abbr}\\b`, 'gi');
    ttsText = ttsText.replace(regex, abbreviations[abbr]);
  });
  
  // Add ACTUAL laughs that Mark will perform (30% chance)
  // Using natural descriptors that voice models interpret as actual laughter
  const laughSounds = [
    '(heh)',
    '(ha)',
    '(hah)',
    '(chuckles)',
    '(laughs)'
  ];
  
  if (Math.random() > 0.7 && (ttsText.includes('my guy') || ttsText.includes('bro') || ttsText.includes('lmao'))) {
    const laugh = laughSounds[Math.floor(Math.random() * laughSounds.length)];
    ttsText = laugh + ' ' + ttsText;
  }
  
  // Natural delivery - no artificial pauses added
  // Mark's voice will naturally pace the speech
  
  // Expand some common slang but keep personality expressions
  ttsText = ttsText.replace(/\bfr fr\b/gi, 'for real for real');
  ttsText = ttsText.replace(/\bfr\b/gi, 'for real');
  ttsText = ttsText.replace(/\btbh\b/gi, 'to be honest');
  ttsText = ttsText.replace(/\bidk\b/gi, 'I don\'t know');
  ttsText = ttsText.replace(/\bomg\b/gi, 'oh my god');
  ttsText = ttsText.replace(/\bngl\b/gi, 'not gonna lie');
  ttsText = ttsText.replace(/\baf\b/gi, 'as hell');
  ttsText = ttsText.replace(/\blmao\b/gi, '(laughs)');
  ttsText = ttsText.replace(/\blol\b/gi, '(chuckles)');
  ttsText = ttsText.replace(/\bmfs\b/gi, 'people');
  ttsText = ttsText.replace(/\bmf\b/gi, 'person');
  
  return ttsText;
}

// ElevenLabs proxy
app.post('/api/voice', async (req, res) => {
  try {
    console.log('🎤 Proxying ElevenLabs request...');
    
    const { text } = req.body;
    
    // Preprocess text for better TTS
    const ttsText = preprocessForTTS(text);
    console.log('📝 Original:', text.substring(0, 50));
    console.log('🗣️ TTS version:', ttsText.substring(0, 50));
    
    // Using Mark voice (natural conversations) - voice ID: iP95p4xoKVk53GoZ742B
    const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/iP95p4xoKVk53GoZ742B', {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        text: ttsText,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.4,
          similarity_boost: 0.8,
          style: 0.6,
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
