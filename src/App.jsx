import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Volume2, VolumeX, Settings, X } from 'lucide-react';

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
  const [showPaymentModal, setShowPaymentModal] = useState(false);
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
    
    try {
      console.log('🔊 Calling backend voice proxy...');
      
      // Call backend proxy instead of ElevenLabs directly (fixes CORS)
      const response = await fetch('/api/voice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text })
      });
      
      console.log('📡 Voice proxy response status:', response.status);
      
      if (response.ok) {
        const audioBlob = await response.blob();
        console.log('✅ Audio received, size:', audioBlob.size, 'bytes');
        
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        audio.play()
          .then(() => console.log('🔊 Playing audio'))
          .catch(err => console.error('❌ Audio play error:', err));
        
        // Clean up after audio finishes
        audio.onended = () => {
          console.log('✅ Audio finished playing');
          URL.revokeObjectURL(audioUrl);
        };
        
        return; // Successfully played
      } else {
        const errorText = await response.text();
        console.error('❌ Voice proxy error:', response.status, errorText);
      }
    } catch (error) {
      console.error('❌ Voice error:', error);
      console.log('⚠️ Falling back to browser TTS...');
    }
    
    // Fallback to browser TTS if proxy fails
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
    const geniePrompt = `you're a genie that roasts wishes. someone wished: "${userWish}"

YOUR STYLE:
- SHORT (1-2 sentences, NO MORE)
- SPECIFIC to their exact wish
- HIT THE PSYCHOLOGY behind why they wished it
- use RELATABLE comparisons everyone gets instantly
- natural slang: nah, bro, lmao, fr, etc

ROAST FORMULA:
1. call out what they REALLY asking for
2. compare it to something specific and devastating
3. DONE. no explaining, no lectures.

GOOD ROASTS THAT ACTUALLY HIT:

"i wish for a lambo"
→ "lambo. you can't even parallel park your civic but sure let's add an italian mid-life crisis to the mix"

"i wish for bitcoin to hit 100k"
→ "100k bitcoin lmao. you bought at 68k didn't you. the copium is hitting different"

"i wish to be rich"
→ "rich. not even a number, just vibes. that's like saying you want 'food' and wondering why you're still hungry"

"i wish for a girlfriend"
→ "girlfriend. my guy you're asking a lamp for relationship advice. your standards and your chances both in the negatives"

"i wish for 5 eth"
→ "5 eth. can't even dream past gas fees. that's the crypto equivalent of wishing for $50 at a casino"

"i wish for true love"
→ "true love from javascript code. disney really did a number on this generation huh"

"i wish to be successful"
→ "successful. bro just ordered the abstract concept and expected delivery. amazon prime got you thinking success ships in 2 days"

"i wish for a million dollars"
→ "million dollars. that's your grandpa's rich. inflation already murdered this wish before i even started"

"i wish for happiness"
→ "happiness from a chatbot. therapy's $150 an hour but you chose to trauma dump to javascript instead"

KEY RULES:
- SPECIFIC comparisons only (civic, gas fees, disney, amazon prime)
- NO lengthy explanations
- HIT what they're ACTUALLY revealing about themselves
- keep it 1-2 sentences MAX
- make it hurt but funny

respond in all lowercase:`;


    try {
      console.log('🤖 Calling backend chat proxy for genie response...');
      
      // Call backend proxy instead of OpenRouter directly (fixes CORS)
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
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

      console.log('📡 Chat proxy response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Chat proxy error:", errorData);
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Chat response received');
      return data.choices[0].message.content.toLowerCase();
    } catch (error) {
      console.error("❌ Chat error:", error);
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
    if (!input.trim() || isLoading) return;
    
    // If no wishes left, show payment modal
    if (wishesLeft === 0) {
      setShowPaymentModal(true);
      return;
    }

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
      finalResponse += "\n\nand with that, your three wishes are complete. the lamp grows cold, the magic fades. but hey, for just 2 usdt you can get 3 more wishes. keep the chaos going.";
      // Show payment modal after a delay
      setTimeout(() => setShowPaymentModal(true), 3000);
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
              disabled={isLoading || (wishesLeft > 0 && !input.trim())}
              className="bg-amber-600 hover:bg-amber-500 text-white rounded-lg px-6 py-3 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {wishesLeft === 0 ? 'get more wishes' : 'wish'}
            </button>
          </div>
          
          {wishesLeft === 0 && (
            <p className="text-amber-400/60 text-sm mt-3 text-center">
              the lamp has been sealed
            </p>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border-2 border-amber-500/30 rounded-2xl p-8 max-w-md w-full relative">
            {/* Close button */}
            <button
              onClick={() => setShowPaymentModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Content */}
            <div className="text-center">
              <Sparkles className="w-16 h-16 text-amber-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-amber-400 mb-2">
                out of wishes?
              </h2>
              <p className="text-slate-300 mb-6">
                get 3 more wishes for just <span className="text-amber-400 font-bold">2 USDT</span>
              </p>

              {/* Wallet Address */}
              <div className="bg-slate-800 rounded-lg p-4 mb-4">
                <p className="text-xs text-slate-400 mb-2">send USDT (any network) to:</p>
                <div className="flex items-center justify-between bg-slate-950 rounded px-3 py-2">
                  <code className="text-amber-400 text-sm break-all">
                    0x47fb8de65435c89fc6252a35dc82e7cb5a391b79
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText('0x47fb8de65435c89fc6252a35dc82e7cb5a391b79');
                      alert('Address copied!');
                    }}
                    className="ml-2 text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    📋
                  </button>
                </div>
              </div>

              {/* Info text */}
              <p className="text-xs text-slate-500 mb-6">
                💡 funds are used to keep the app running and cover API costs
              </p>

              {/* Action button */}
              <button
                onClick={() => {
                  setWishesLeft(3);
                  setShowPaymentModal(false);
                  alert('3 wishes added! enjoy the chaos 🔥');
                }}
                className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 px-6 rounded-lg transition-all"
              >
                i've sent 2 USDT - add 3 wishes
              </button>

              <p className="text-xs text-slate-500 mt-3">
                honor system - click after sending payment
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}