import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

export default function UnhingedGenie() {
  const [currentResponse, setCurrentResponse] = useState("tap the lamp and speak your wish, mortal...");
  const [wishesLeft, setWishesLeft] = useState(3);
  const [isLoading, setIsLoading] = useState(false);
  const [usedFallbacks, setUsedFallbacks] = useState(new Set());
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [userWish, setUserWish] = useState('');
  const [displayedWish, setDisplayedWish] = useState('');
  const [genieResponse, setGenieResponse] = useState('');
  
  const recognitionRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const pendingWishRef = useRef('');
  const submitWishRef = useRef(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        console.log('🎤 Voice recognition started');
        setIsListening(true);
        setCurrentResponse("listening to your wish...");
      };
      
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
        
        console.log('🗣️ Transcript:', transcript);
        setUserWish(transcript);
        
        // Store in ref for use in onend
        if (event.results[0].isFinal) {
          console.log('✅ Final transcript received');
          pendingWishRef.current = transcript;
        }
      };
      
      recognition.onerror = (event) => {
        console.error('❌ Speech recognition error:', event.error);
        setIsListening(false);
        pendingWishRef.current = '';
        setCurrentResponse("couldn't hear you, mortal. tap again.");
        
        if (event.error === 'not-allowed') {
          setCurrentResponse("microphone blocked. allow access to speak your wishes.");
        }
      };
      
      recognition.onend = () => {
        console.log('🎤 Voice recognition ended');
        setIsListening(false);
        
        // Submit the wish if we have one
        const wish = pendingWishRef.current;
        if (wish && wish.trim()) {
          console.log('📤 Submitting wish:', wish);
          pendingWishRef.current = '';
          // Use a small delay to ensure state is updated
          setTimeout(() => {
            if (submitWishRef.current) {
              submitWishRef.current(wish);
            }
          }, 100);
        }
      };
      
      recognitionRef.current = recognition;
    } else {
      setSpeechSupported(false);
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // Initialize Audio Context for visualization
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    analyserRef.current = audioContextRef.current.createAnalyser();
    analyserRef.current.fftSize = 256;
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const startAudioVisualization = (audioElement) => {
    if (!audioContextRef.current || !analyserRef.current) return;
    
    try {
      const source = audioContextRef.current.createMediaElementSource(audioElement);
      source.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);
      
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      
      const updateLevel = () => {
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAudioLevel(average / 255);
        
        if (isPlaying) {
          animationFrameRef.current = requestAnimationFrame(updateLevel);
        }
      };
      
      updateLevel();
    } catch (e) {
      console.log('Audio already connected or error:', e);
    }
  };

  const speakText = async (text) => {
    if (!voiceEnabled) return;
    
    setIsPlaying(true);
    
    try {
      const response = await fetch('/api/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      
      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        // Resume audio context if suspended
        if (audioContextRef.current?.state === 'suspended') {
          await audioContextRef.current.resume();
        }
        
        audio.onplay = () => {
          startAudioVisualization(audio);
        };
        
        audio.onended = () => {
          setIsPlaying(false);
          setAudioLevel(0);
          URL.revokeObjectURL(audioUrl);
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
          }
        };
        
        await audio.play();
        return;
      }
    } catch (error) {
      console.error('Voice error:', error);
    }
    
    // Fallback to browser TTS
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.15;
      utterance.pitch = 0.85;
      
      // Simulate audio levels for browser TTS
      let fakeLevel = 0;
      const interval = setInterval(() => {
        fakeLevel = 0.3 + Math.random() * 0.5;
        setAudioLevel(fakeLevel);
      }, 100);
      
      utterance.onend = () => {
        clearInterval(interval);
        setIsPlaying(false);
        setAudioLevel(0);
      };
      
      window.speechSynthesis.speak(utterance);
    } else {
      setIsPlaying(false);
      setAudioLevel(0);
    }
  };

  const generateGenieResponse = async (wish) => {
    const geniePrompt = `you're a genie that roasts wishes. someone wished: "${wish}"

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

KEY RULES:
- SPECIFIC comparisons only
- NO lengthy explanations
- HIT what they're ACTUALLY revealing about themselves
- keep it 1-2 sentences MAX
- make it hurt but funny

respond in all lowercase:`;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "anthropic/claude-3.5-sonnet",
          messages: [{ role: "user", content: geniePrompt }],
          temperature: 1.3,
          max_tokens: 200
        })
      });

      if (!response.ok) throw new Error(`API returned ${response.status}`);

      const data = await response.json();
      return data.choices[0].message.content.toLowerCase();
    } catch (error) {
      console.error("Chat error:", error);
      
      const allFallbacks = [
        "nah see this is wild. you're out here wishing while jeff bezos is literally building rockets.",
        "interesting choice. kanye made college dropout. you just made a mid wish.",
        "bro said what he said with full confidence. respect. wrong, but respect",
        "this giving major 'i'll start monday' energy. we both know how this ends",
        "you know what? the fact that you thought this would work is actually impressive.",
        "nah this is it. this is the wish that historians will study.",
        "my guy woke up and chose chaos. not the good kind either.",
        "you ever see someone miss so badly it's almost artistic? yeah",
        "this hitting different and not in the way you hoped. try again g",
        "the audacity is crazy. the follow-through? nonexistent."
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
      return selectedFallback;
    }
  };

  const handleWish = async (wish) => {
    if (!wish?.trim() || isLoading) return;
    
    if (wishesLeft === 0) {
      setShowPaymentModal(true);
      return;
    }

    setIsLoading(true);
    setDisplayedWish(wish);
    setGenieResponse('');
    setCurrentResponse("the genie contemplates your fate...");

    const newWishesLeft = wishesLeft - 1;
    setWishesLeft(newWishesLeft);

    const response = await generateGenieResponse(wish);
    
    let finalResponse = response;
    
    if (newWishesLeft === 0) {
      finalResponse += " ...and with that, your three wishes are complete.";
      setTimeout(() => setShowPaymentModal(true), 4000);
    }

    setGenieResponse(finalResponse);
    setCurrentResponse(finalResponse);
    setUserWish('');
    speakText(finalResponse);
    setIsLoading(false);
  };

  // Keep the ref updated with the latest handleWish function
  submitWishRef.current = handleWish;

  const startListening = () => {
    if (!recognitionRef.current || isLoading || isPlaying) return;
    
    if (wishesLeft === 0) {
      setShowPaymentModal(true);
      return;
    }
    
    // Stop any playing audio
    window.speechSynthesis?.cancel();
    setAudioLevel(0);
    
    // Resume audio context on user interaction
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }
    
    recognitionRef.current.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  // Calculate orb scale based on audio level
  const orbScale = 1 + (audioLevel * 0.4);
  const glowIntensity = 20 + (audioLevel * 80);
  const glowOpacity = 0.5 + (audioLevel * 0.5);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center p-4 overflow-hidden">
      
      {/* Ambient particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-amber-400/30 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 10}s`
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-amber-400" />
          <span className="text-amber-400 font-bold text-xl tracking-wider">GENIE</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className="p-2 rounded-full bg-slate-800/50 hover:bg-slate-700/50 transition-colors border border-amber-500/20"
          >
            {voiceEnabled ? (
              <Volume2 className="w-5 h-5 text-amber-400" />
            ) : (
              <VolumeX className="w-5 h-5 text-slate-500" />
            )}
          </button>
          <div className="text-center">
            <div className="text-amber-400 font-bold text-2xl">{wishesLeft}</div>
            <div className="text-slate-500 text-xs uppercase tracking-wider">wishes</div>
          </div>
        </div>
      </div>

      {/* Main Orb */}
      <div className="relative flex flex-col items-center pt-20 w-full max-w-lg">
        
        {/* The Lamp/Orb */}
        <div 
          className="relative cursor-pointer group"
          onClick={isListening ? stopListening : startListening}
        >
          {/* Outer glow rings */}
          <div 
            className="absolute inset-0 rounded-full transition-all duration-100"
            style={{
              transform: `scale(${orbScale * 1.5})`,
              background: `radial-gradient(circle, rgba(251, 191, 36, ${glowOpacity * 0.1}) 0%, transparent 70%)`,
              filter: `blur(${glowIntensity}px)`
            }}
          />
          <div 
            className="absolute inset-0 rounded-full transition-all duration-100"
            style={{
              transform: `scale(${orbScale * 1.2})`,
              background: `radial-gradient(circle, rgba(251, 191, 36, ${glowOpacity * 0.2}) 0%, transparent 60%)`,
              filter: `blur(${glowIntensity * 0.5}px)`
            }}
          />
          
          {/* Main orb */}
          <div 
            className="relative w-48 h-48 rounded-full transition-all duration-100 ease-out"
            style={{
              transform: `scale(${orbScale})`,
              background: `radial-gradient(circle at 30% 30%, 
                rgba(251, 191, 36, 0.9) 0%, 
                rgba(217, 119, 6, 0.8) 30%, 
                rgba(180, 83, 9, 0.9) 60%, 
                rgba(120, 53, 15, 0.95) 100%)`,
              boxShadow: `
                0 0 ${glowIntensity}px rgba(251, 191, 36, ${glowOpacity}),
                0 0 ${glowIntensity * 2}px rgba(251, 191, 36, ${glowOpacity * 0.5}),
                inset 0 0 60px rgba(0, 0, 0, 0.3),
                inset 0 -20px 40px rgba(0, 0, 0, 0.4)
              `
            }}
          >
            {/* Inner shine */}
            <div className="absolute top-6 left-8 w-16 h-8 bg-gradient-to-br from-white/40 to-transparent rounded-full blur-sm" />
            
            {/* Center icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              {isListening ? (
                <div className="flex items-center justify-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-white/80 rounded-full animate-soundbar"
                      style={{
                        height: `${20 + Math.random() * 30}px`,
                        animationDelay: `${i * 0.1}s`
                      }}
                    />
                  ))}
                </div>
              ) : isLoading ? (
                <div className="w-12 h-12 border-4 border-white/20 border-t-white/80 rounded-full animate-spin" />
              ) : (
                <Sparkles className="w-16 h-16 text-white/80" />
              )}
            </div>
          </div>
          
          {/* Tap hint */}
          {!isListening && !isLoading && !isPlaying && (
            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-amber-400/60 text-sm animate-pulse whitespace-nowrap">
              tap to speak
            </div>
          )}
        </div>

        {/* Wish and Response Cards */}
        <div className="mt-20 px-4 w-full max-w-lg space-y-4">
          
          {/* Wish Card */}
          {(displayedWish || isListening) && (
            <div 
              className="relative rounded-2xl p-4 transition-all duration-300"
              style={{
                background: 'rgba(15, 23, 42, 0.8)',
                boxShadow: '0 0 30px rgba(0, 0, 0, 0.8), 0 0 60px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(100, 116, 139, 0.2)'
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                <span className="text-xs uppercase tracking-wider text-slate-500 font-medium">wish</span>
              </div>
              <p className={`text-lg leading-relaxed ${isListening ? 'text-amber-300' : 'text-slate-300'}`}>
                {isListening ? (userWish || 'listening...') : displayedWish}
              </p>
            </div>
          )}

          {/* Response Card */}
          {(genieResponse || isLoading) && (
            <div 
              className="relative rounded-2xl p-4 transition-all duration-300"
              style={{
                background: 'rgba(15, 23, 42, 0.8)',
                boxShadow: '0 0 30px rgba(0, 0, 0, 0.8), 0 0 60px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(251, 191, 36, 0.2)'
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                <span className="text-xs uppercase tracking-wider text-amber-500/80 font-medium">response</span>
              </div>
              <p className={`text-lg leading-relaxed ${isLoading ? 'text-slate-400 italic' : 'text-slate-200'}`}>
                {isLoading ? 'the genie contemplates your fate...' : genieResponse}
              </p>
            </div>
          )}

          {/* Initial prompt when nothing is shown */}
          {!displayedWish && !isListening && !genieResponse && (
            <p className="text-center text-slate-400 text-lg">
              tap the lamp and speak your wish, mortal...
            </p>
          )}
        </div>
      </div>

      {/* Bottom mic button (alternative input) */}
      {speechSupported && (
        <div className="pb-8 pt-4">
          <button
            onClick={isListening ? stopListening : startListening}
            disabled={isLoading || isPlaying}
            className={`p-5 rounded-full transition-all duration-300 ${
              isListening
                ? 'bg-red-500 hover:bg-red-400 scale-110 animate-pulse'
                : 'bg-slate-800/80 hover:bg-slate-700/80 border border-amber-500/30'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isListening ? (
              <MicOff className="w-7 h-7 text-white" />
            ) : (
              <Mic className="w-7 h-7 text-amber-400" />
            )}
          </button>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-8 max-w-md w-full text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            
            <h2 className="text-2xl font-bold text-amber-400 mb-2">
              the lamp grows cold
            </h2>
            <p className="text-slate-400 mb-6">
              rekindle the flame for <span className="text-amber-400 font-bold">2 USDT</span>
            </p>

            <div className="bg-slate-800 rounded-lg p-4 mb-6">
              <p className="text-xs text-slate-500 mb-2">send USDT to:</p>
              <code className="text-amber-400 text-sm break-all">
                0x47fb8de65435c89fc6252a35dc82e7cb5a391b79
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText('0x47fb8de65435c89fc6252a35dc82e7cb5a391b79');
                }}
                className="mt-2 text-xs text-slate-400 hover:text-amber-400 transition-colors"
              >
                copy address
              </button>
            </div>

            <button
              onClick={() => {
                setWishesLeft(3);
                setShowPaymentModal(false);
                setCurrentResponse("the flame burns anew. speak your wish, mortal...");
              }}
              className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-4 px-6 rounded-xl transition-all"
            >
              i've sent payment
            </button>
            
            <button
              onClick={() => setShowPaymentModal(false)}
              className="mt-3 text-slate-500 hover:text-slate-300 text-sm transition-colors"
            >
              maybe later
            </button>
          </div>
        </div>
      )}

      {/* Custom styles */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
          25% { transform: translateY(-20px) translateX(10px); opacity: 0.6; }
          50% { transform: translateY(-40px) translateX(-10px); opacity: 0.3; }
          75% { transform: translateY(-20px) translateX(5px); opacity: 0.5; }
        }
        
        @keyframes soundbar {
          0%, 100% { height: 10px; }
          50% { height: 40px; }
        }
        
        .animate-float {
          animation: float linear infinite;
        }
        
        .animate-soundbar {
          animation: soundbar 0.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
