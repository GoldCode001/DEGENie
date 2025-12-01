# Unhinged Genie 🧞

A chaotic, sarcastic genie chatbot that never grants wishes but roasts you instead. Perfect for bear market entertainment.

## Features

- 🎭 Unhinged, sarcastic responses
- 🎤 ElevenLabs voice integration
- 🤖 Powered by Claude via OpenRouter
- 3 wishes (none of which will be granted)

## Local Development

```bash
npm install
npm run dev
```

## Deploy to Railway

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "initial commit"
   git branch -M main
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Deploy on Railway:**
   - Go to [railway.app](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Railway will auto-detect it's a Vite project
   - Add these environment variables if needed:
     - `PORT` (optional, defaults to 3000)
   - Click "Deploy"

3. **Build Settings (should be auto-detected):**
   - Build Command: `npm run build`
   - Start Command: `npm run preview`

## API Keys

The app is pre-configured with:
- OpenRouter API key for Claude responses
- ElevenLabs API key for voice

If you want to use your own keys, update them in `src/App.jsx`.

## Tech Stack

- React + Vite
- Tailwind CSS
- Lucide React (icons)
- OpenRouter (Claude API)
- ElevenLabs (voice)
