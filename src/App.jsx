import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Volume2, VolumeX, Settings } from 'lucide-react';

export default function UnhingedGenie() {
  const [messages, setMessages] = useState([
    {
      role: 'genie',
      content: "greetings, mortal. i am the genie, ancient and powerful, here to grant your deepest desires. you have three wishes. choose wisely, for such opportunities are rare in this world. what is your first wish?"
    }
  ]);
  const [input, setInput] = useState('');
  const [wishesLeft, setWishesLeft] = useState(3);
  const [isLoading, setIsLoading] = useState(false);
  const [usedFallbacks, setUsedFallbacks] = useState(new Set());
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [elevenLabsKey, setElevenLabsKey] = useState('sk_c45cc1bd3b396ca5277a1bc62c005d216140371f44c23f5f');
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize voices for Web Speech API
  useEffect(() => {
    if ('speechSynthesis' in window) {
      // Load voices
      window.speechSynthesis.getVoices();
      // Some browsers need this event listener
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  const speakText = async (text) => {
    if (!voiceEnabled) return;
    
    console.log('🎤 Attempting to speak with ElevenLabs...');
    
    // If ElevenLabs API key is provided, use that (MUCH better quality)
    if (elevenLabsKey) {
      try {
        console.log('🔑 Using ElevenLabs API key:', elevenLabsKey.substring(0, 15) + '...');
        
        // Using Adam voice - deep, authoritative, perfect for deadpan sarcastic genie
        const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/pNInz6obpgDQGcFmaJgB', {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': elevenLabsKey
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
          const audioBlob = await response.blob();
          console.log('✅ ElevenLabs audio received, size:', audioBlob.size, 'bytes');
          
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          
          audio.play()
            .then(() => console.log('🔊 Playing ElevenLabs audio'))
            .catch(err => console.error('❌ Audio play error:', err));
          
          // Clean up after audio finishes
          audio.onended = () => {
            console.log('✅ Audio finished playing');
            URL.revokeObjectURL(audioUrl);
          };
          
          return; // Successfully played with ElevenLabs
        } else {
          const errorText = await response.text();
          console.error('❌ ElevenLabs API error:', response.status, errorText);
        }
      } catch (error) {
        console.error('❌ ElevenLabs error:', error);
        console.log('⚠️ Falling back to browser TTS...');
      }
    } else {
      console.log('⚠️ No ElevenLabs key, using browser TTS');
    }
    
    // Fallback to browser TTS if ElevenLabs fails
    if (!('speechSynthesis' in window)) {
      console.error('❌ Browser TTS not supported');
      return;
    }
    
    console.log('🗣️ Using browser TTS as fallback');
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.15;
    utterance.pitch = 0.85;
    utterance.volume = 1.0;
    
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.lang.startsWith('en') && (
        voice.name.includes('Natural') || 
        voice.name.includes('Enhanced') ||
        voice.name.includes('Premium') ||
        voice.name.includes('Google')
      )
    ) || voices.find(voice => voice.lang.startsWith('en-US'));
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
      console.log('🎙️ Using voice:', preferredVoice.name);
    }
    
    window.speechSynthesis.speak(utterance);
  };

  const generateGenieResponse = async (userWish) => {
    const geniePrompt = `you're a genie but you're absolutely unhinged and savage af. someone made this wish: "${userWish}"

YOUR PERSONALITY: chaotic, roasts hard, no filter, dark humor, internet culture expert, crypto degen energy

RULES:
- 70%: engage with their wish but ROAST IT HARD using references from anywhere - movies, history, crypto, memes, science, pop culture
- 30%: acknowledge their wish in 3-5 words then pivot to unrelated chaos

be DEADLY. be SAVAGE. make people laugh and feel slightly attacked at the same time.

use slang: nah, bruh, fr, lowkey, deadass, tbh, literally, cap, ngmi, gm, cope, etc

EXAMPLES OF DEADLY RESPONSES:

"i wish for a lambo"
→ "a lambo lmao. my guy you're out here wishing to a chatbot and your first thought is overpriced italian maintenance fees on wheels. thanos had the infinity stones and wanted balance. you got three wishes and want to compensate. we are not the same"

"i wish for bitcoin to hit 100k"
→ "100k bitcoin yeah? cool cool. you know what else people wished for? world peace, cure for cancer, their dad to come back. but nah you're out here with 'number go up' energy. michael burry saw the housing crash coming. i see your portfolio and it's giving 2022 vibes"

"i wish to be rich"
→ "rich. my guy just said rich. not how, not when, just 'rich'. that's like asking gps for 'somewhere nice' and expecting a destination. jeff bezos started amazon in a garage. you started this wish in delusion. the gap is astronomical"

"i wish for a girlfriend"
→ "girlfriend huh, respect the honesty. but homie you're asking a lamp. a LAMP. even aladdin had to go outside and steal bread first. you skipped the entire character development arc and went straight to final boss energy. touch grass g"

"i wish for 5 eth"
→ "5 eth okay. fun fact: ethereum's gas fees cost more than your ambition apparently. vitalik created a whole blockchain. you created this mid-tier wish. somewhere a vc is laughing and they don't even know why"

"i wish for success"
→ "success. vague ass wish energy. that's like ordering 'food' at a restaurant. gordon ramsay would throw you out. i'm a mystical being and even i need specifics. this is why you're still saying 'one day' bro"

BE CREATIVE. ROAST HARD. REFERENCE EVERYTHING. make it personal but funny. keep it 2-4 sentences max.

respond in all lowercase:`;

    try {
      console.log('🤖 Calling OpenRouter API for genie response...');
      
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer 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"
        },
        body: JSON.stringify({
          model: "anthropic/claude-3.5-sonnet",
          messages: [
            { 
              role: "user", 
              content: geniePrompt 
            }
          ],
          temperature: 1.3,
          max_tokens: 200
        })
      });

      console.log('📡 OpenRouter response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ OpenRouter API Error:", errorData);
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ OpenRouter response received');
      return data.choices[0].message.content.toLowerCase();
    } catch (error) {
      console.error("❌ OpenRouter error:", error);
      console.log('⚠️ Using fallback response because API failed');
      
      // Deadly fallbacks
      const allFallbacks = [
        "nah see this is wild. you're out here wishing while jeff bezos is literally building rockets. the confidence is admirable, the execution is not",
        "interesting choice. kanye made college dropout. you just made a mid wish. the parallel is there somewhere",
        "bro said what he said with full confidence. respect. wrong, but respect",
        "this giving major 'i'll start monday' energy. we both know how this ends",
        "you know what? the fact that you thought this would work is actually impressive. not in a good way, but impressive",
        "nah this is it. this is the wish that historians will study and wonder what happened here",
        "my guy woke up and chose chaos. not the good kind either. just chaos",
        "you ever see someone miss so badly it's almost artistic? yeah",
        "this hitting different and not in the way you hoped. try again g",
        "the audacity is crazy. the follow-through? nonexistent. tale as old as time"
      ];
      
      const availableFallbacks = allFallbacks.filter((_, index) => !usedFallbacks.has(index));
      
      if (availableFallbacks.length === 0) {
        setUsedFallbacks(new Set());
        return allFallbacks[0];
      }
      
      const randomIndex = Math.floor(Math.random() * availableFallbacks.length);
      const selectedFallback = availableFallbacks[randomIndex];
      const originalIndex = allFallbacks.indexOf(selectedFallback);
      
      setUsedFallbacks(prev => new Set([...prev, originalIndex]));
      
      console.log(`💬 Using fallback #${originalIndex}: "${selectedFallback.substring(0, 50)}..."`);
      
      return selectedFallback;
    }
  };

  const handleSendWish = async () => {
    if (!input.trim() || wishesLeft === 0 || isLoading) return;

    const userWish = input.trim();
    setInput('');
    
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: userWish }]);
    setIsLoading(true);

    // Decrease wishes
    const newWishesLeft = wishesLeft - 1;
    setWishesLeft(newWishesLeft);

    // Generate genie response
    const genieResponse = await generateGenieResponse(userWish);
    
    let finalResponse = genieResponse;
    
    // Add special message if that was the last wish
    if (newWishesLeft === 0) {
      finalResponse += "\n\nand with that, your three wishes are complete. the lamp grows cold, the magic fades. i must return to the void... or maybe just my netflix queue. same thing really.";
    }

    setMessages(prev => [...prev, { 
      role: 'genie', 
      content: finalResponse 
    }]);
    
    // Speak the response
    speakText(finalResponse);
    
    setIsLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendWish();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-slate-900/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-amber-500/20 overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 border-b border-amber-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-amber-400" />
              <div>
                <h1 className="text-3xl font-bold text-amber-400">
                  genie
                </h1>
                <p className="text-slate-400 text-sm">ancient mystical entity</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors border border-amber-500/20"
                title="settings"
              >
                <Settings className="w-5 h-5 text-amber-400" />
              </button>
              <button
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors border border-amber-500/20"
                title={voiceEnabled ? "voice on" : "voice off"}
              >
                {voiceEnabled ? (
                  <Volume2 className="w-5 h-5 text-amber-400" />
                ) : (
                  <VolumeX className="w-5 h-5 text-slate-500" />
                )}
              </button>
              <div className="text-right">
                <div className="text-amber-400 font-bold text-2xl">{wishesLeft}</div>
                <div className="text-slate-400 text-xs">wishes remaining</div>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="h-[500px] overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-xl p-4 ${
                  message.role === 'user'
                    ? 'bg-slate-700 text-white'
                    : 'bg-slate-800/80 text-slate-100 border border-amber-500/20'
                }`}
              >
                {message.role === 'genie' && (
                  <div className="flex items-center gap-2 mb-2 text-amber-400 font-semibold text-sm">
                    <Sparkles className="w-4 h-4" />
                    <span>genie</span>
                  </div>
                )}
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-800/80 text-slate-100 rounded-xl p-4 border border-amber-500/20">
                <div className="flex items-center gap-2 mb-2 text-amber-400 font-semibold text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>genie</span>
                </div>
                <p className="text-slate-300">...</p>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-amber-500/20 p-6 bg-slate-900/50">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={wishesLeft > 0 ? "state your wish..." : "your wishes have been granted"}
              disabled={isLoading}
              className="flex-1 bg-slate-800 text-white placeholder-slate-500 rounded-lg px-4 py-3 border border-amber-500/20 focus:outline-none focus:border-amber-500/40 disabled:opacity-50"
            />
            <button
              onClick={handleSendWish}
              disabled={!input.trim() || wishesLeft === 0 || isLoading}
              className="bg-amber-600 hover:bg-amber-500 text-white rounded-lg px-6 py-3 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              wish
            </button>
          </div>
          
          {wishesLeft === 0 && (
            <p className="text-amber-400/60 text-sm mt-3 text-center">
              the lamp has been sealed
            </p>
          )}
        </div>
      </div>
    </div>
  );
}