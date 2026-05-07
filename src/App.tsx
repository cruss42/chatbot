import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, ChevronLeft, Info, Camera, Mic, Plus, Smile, Sun, Moon, Heart, User, UserCheck } from 'lucide-react';
import { sendMessage, Message, Gender, Mood } from './services/geminiService';

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('online');
  const [showMenu, setShowMenu] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Relationship stats
  const [loveLevel, setLoveLevel] = useState(1);
  const [loveExp, setLoveExp] = useState(0);
  const [floatingHearts, setFloatingHearts] = useState<{ id: number; x: number }[]>([]);

  // New features
  const [gender, setGender] = useState<Gender>('female');
  const [mood, setMood] = useState<Mood>('sweet');

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedLevel = localStorage.getItem('love_level');
    const savedExp = localStorage.getItem('love_exp');
    const savedGender = localStorage.getItem('gender');
    const savedMood = localStorage.getItem('mood');

    if (savedLevel) setLoveLevel(JSON.parse(savedLevel));
    if (savedExp) setLoveExp(JSON.parse(savedExp));
    if (savedGender) setGender(JSON.parse(savedGender) as Gender);
    if (savedMood) setMood(JSON.parse(savedMood) as Mood);
  }, []);

  useEffect(() => {
    localStorage.setItem('love_level', JSON.stringify(loveLevel));
    localStorage.setItem('love_exp', JSON.stringify(loveExp));
    localStorage.setItem('gender', JSON.stringify(gender));
    localStorage.setItem('mood', JSON.stringify(mood));
  }, [loveLevel, loveExp, gender, mood]);

  const triggerHearts = () => {
    const newHearts = Array.from({ length: 5 }).map((_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 80 + 10
    }));
    setFloatingHearts(prev => [...prev, ...newHearts]);
    setTimeout(() => {
      setFloatingHearts(prev => prev.filter(h => !newHearts.find(nh => nh.id === h.id)));
    }, 3000);
  };

  useEffect(() => {
    // Set random status variations every few minutes
    const statuses = [
      'lagi kangen kamu', 
      'mikirin kamu terus', 
      'online', 
      'lagi pengen dimanja', 
      'nungguin kamu bales',
      'liatin foto kita',
      'sayang kamu banget',
      'lagi ngantuk tapi mau chat',
      'kangen pelukan kamu',
      'jangan centang dua ya',
      'kamu kok lucu banget',
      'dunia milik kita berdua'
    ];
    const interval = setInterval(() => {
      setStatus(statuses[Math.floor(Math.random() * statuses.length)]);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isDarkMode) document.body.classList.add('dark');
    else document.body.classList.remove('dark');
  }, [isDarkMode]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isLoading]);

  const handleSend = async (textOverride?: string) => {
    const messageText = textOverride || input;
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', parts: [{ text: messageText }] };
    setMessages((prev) => [...prev, userMessage]);
    
    // Love level logic
    const loveKeywords = ['sayang', 'love', 'kangen', '❤️', 'cinta', 'manis', 'muach', 'cipok'];
    const rudeKeywords = ['jelek', 'benci', 'jauh', 'pergi', 'asik sendiri', 'nyebelin', 'jahat'];

    if (loveKeywords.some(key => messageText.toLowerCase().includes(key))) {
      triggerHearts();
      if (mood === 'angry') setMood('sweet'); // Forgive if say sweet things
    }

    if (rudeKeywords.some(key => messageText.toLowerCase().includes(key))) {
      setMood('angry');
    }

    setLoveExp(prev => {
      const addedExp = messageText.length > 20 ? 15 : 8;
      const newExp = mood === 'angry' ? prev + (addedExp / 2) : prev + addedExp; // Slower progress when angry
      if (newExp >= 100) {
        setLoveLevel(l => l + 1);
        return newExp - 100;
      }
      return newExp;
    });

    if (!textOverride) setInput('');
    setIsLoading(true);
    setShowMenu(false);

    const response = await sendMessage(messages, messageText, gender, mood);
    
    if (response) {
      const modelMessage: Message = { role: 'model', parts: [{ text: response }] };
      setMessages((prev) => [...prev, modelMessage]);
    }
    setIsLoading(false);
  };

  const stickers = [
    { emoji: '💖', label: 'love' },
    { emoji: '🐱', label: 'cat' },
    { emoji: '🥺', label: 'pleading' },
    { emoji: '🧸', label: 'bear' },
    { emoji: '🌸', label: 'flower' },
    { emoji: '🐥', label: 'chick' },
    { emoji: '🐶', label: 'dog' },
    { emoji: '🦄', label: 'unicorn' },
    { emoji: '🍬', label: 'candy' },
    { emoji: '🦋', label: 'butterfly' },
    { emoji: '🌈', label: 'rainbow' },
    { emoji: '🍓', label: 'strawberry' },
  ];

  const handleSendSticker = (emoji: string) => {
    const stickerMsg: Message = { role: 'user', parts: [{ text: `sticker:${emoji}` }] };
    setMessages((prev) => [...prev, stickerMsg]);
    setShowMenu(false);
    setIsLoading(true);
    
    // Auto reply for sticker
    setTimeout(async () => {
      const response = await sendMessage(messages, `aku barusan kirim stiker ${emoji} ke kamu, reaksi kamu gimana?`, gender, mood);
      if (response) {
        setMessages((prev) => [...prev, { role: 'model', parts: [{ text: response }] }]);
      }
      setIsLoading(false);
    }, 1000);
  };

  const quickActions: {label: string, action: string}[] = [];

  return (
    <div className="chat-container">
      {/* Floating Hearts */}
      <AnimatePresence>
        {floatingHearts.map(heart => (
          <motion.div
            key={heart.id}
            initial={{ y: '100vh', opacity: 1, scale: 0.5 }}
            animate={{ 
              y: '-20vh', 
              opacity: 0, 
              scale: [0.5, 1.2, 0.8],
              x: `${heart.x + Math.sin(heart.id) * 20}vw`
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.5, ease: "easeOut" }}
            className="fixed pointer-events-none z-[100] text-3xl"
            style={{ left: `${heart.x}vw` }}
          >
            ❤️
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Header */}
      <header className="ios-header px-4 pt-3 pb-2 flex flex-col border-b border-slate-200 dark:border-white/5 transition-colors relative">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-1 text-ios-blue text-[17px] font-normal cursor-pointer">
            <ChevronLeft size={24} />
            <span>7</span>
          </div>
          <div 
            className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => {
              setGender(prev => prev === 'female' ? 'male' : 'female');
              setMessages([]); // Clear chat history on gender change
              setMood('sweet'); // Reset mood on gender change
            }}
          >
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-zinc-800 flex items-center justify-center text-slate-500 mb-0.5 relative">
              {gender === 'female' ? <User size={16} className="text-pink-500" /> : <UserCheck size={16} className="text-blue-500" />}
              <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-zinc-900 ${mood === 'angry' ? 'bg-red-500' : 'bg-green-500'}`} />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[11px] font-semibold flex items-center gap-1 dark:text-white">
                {gender === 'female' ? 'aria' : 'chris'} <Info size={10} className={`${mood === 'angry' ? 'text-red-500' : 'text-ios-blue'}`} />
              </span>
              <span className={`text-[9px] font-medium ${mood === 'angry' ? 'text-red-400' : 'text-slate-400'}`}>
                {mood === 'angry' ? 'lagi ambek' : status}
              </span>
            </div>
          </div>
          <div className="flex items-center">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            >
              {isDarkMode ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-slate-400" />}
            </button>
          </div>
        </div>

        {/* Love Progress Bar */}
        <div className="mt-2 flex items-center gap-2 px-2">
          <motion.div 
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-xs"
          >
            💖
          </motion.div>
          <div className="flex-1 h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${loveExp}%` }}
              className="h-full bg-gradient-to-r from-pink-400 to-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]"
            />
          </div>
          <span className="text-[10px] font-bold text-rose-500 dark:text-rose-400">
            lv.{loveLevel}
          </span>
        </div>
      </header>


      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-4"
      >
        <AnimatePresence>
          {messages.map((msg, idx) => {
            const text = msg.parts[0].text;
            const isSticker = text.startsWith('sticker:');
            
            const emoji = isSticker ? text.split(':')[1] : '';

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {isSticker ? (
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="text-6xl py-2 cursor-pointer select-none"
                  >
                    {emoji}
                  </motion.div>
                ) : (
                  <div className={msg.role === 'user' ? 'imessage-user' : 'imessage-aria'}>
                    <p className="text-[16px] leading-tight break-words">
                      {text}
                    </p>
                  </div>
                )}
              </motion.div>
            );
          })}

          {isLoading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="imessage-aria py-2 px-4">
                <div className="flex gap-1 items-center h-4">
                  <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                  <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                  <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Plus Menu */}
      <AnimatePresence>
        {showMenu && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="action-menu"
          >
            <div className="p-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Kirim Sticker</p>
              <div className="grid grid-cols-4 gap-2">
                {stickers.slice(0, 8).map((s, idx) => (
                  <button 
                    key={idx}
                    onClick={() => handleSendSticker(s.emoji)}
                    className="text-2xl hover:bg-slate-100 dark:hover:bg-zinc-700 p-2 rounded-xl transition-colors flex items-center justify-center bg-slate-50 dark:bg-zinc-800"
                  >
                    {s.emoji}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <footer className="p-3 bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-white/5 flex items-center gap-3 relative z-30 transition-colors">
        <button 
          onClick={() => setShowMenu(!showMenu)}
          className={`transition-transform duration-200 ${showMenu ? 'rotate-45 text-ios-blue' : 'text-slate-400'}`}
        >
          <Plus size={24} />
        </button>
        <Camera className="text-slate-400 cursor-pointer hidden sm:block" size={24} />
        <button 
          onClick={() => setShowMenu(!showMenu)}
          className={`transition-all duration-200 ${showMenu ? 'scale-110 text-ios-blue' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Smile size={24} />
        </button>
        
        <div className="flex-1 relative flex items-center">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="ketik pesan..."
            className="w-full bg-slate-100 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-full px-4 py-1.5 text-[16px] outline-none placeholder:text-slate-400 dark:text-white"
          />
          {input.trim() && (
            <button 
              onClick={() => handleSend()}
              className="absolute right-1 w-8 h-8 bg-ios-blue text-white rounded-full flex items-center justify-center -mr-0.5"
            >
              <Send size={16} fill="white" className="ml-0.5" />
            </button>
          )}
        </div>
        
      </footer>
      <div className="pb-1 opacity-20 flex justify-center w-full select-none pointer-events-none">
        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest font-mono">
          @zeechrsv
        </p>
      </div>
    </div>
  );
}

