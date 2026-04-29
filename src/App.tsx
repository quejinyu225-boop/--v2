/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, 
  Sparkles, 
  Zap, 
  Ear, 
  Mail, 
  ShieldAlert, 
  Compass, 
  Smile,
  ArrowRight,
  Activity
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  ResponsiveContainer,
  YAxis
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Types
type MoodLevel = 'normal' | 'warn' | 'emergency';
type Message = {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
  statusLog?: string; // Developer only
  alias?: string; // Floating alias label
  stage?: 'bubbling' | 'merging' | 'ready' | 'floating'; 
};

// Character logic
const getAiResponse = (text: string, moodScore: number): { content: string, status: MoodLevel, alias?: string } => {
  const library = [
    { category: "听点好的", alias: "耳朵抱抱", tags: ["入睡", "解压", "白噪音", "失眠", "睡不着"], tone: "把脑子里的弹幕关掉，现在是强制关机时间，听完这首准时打呼。" },
    { category: "听点好的", alias: "深海潜水", tags: ["冥想", "焦虑", "波动", "不安", "5分钟"], tone: "别在岸上纠结了，跟我去深海吐个泡泡，把烦心事都淹死。" },
    { category: "听点好的", alias: "云端漫步", tags: ["放松", "白日梦", "轻音乐", "休息"], tone: "既然不能去蹦迪，就去云彩上踩两脚。这节奏，宝宝听了都想躺平。" },
    { category: "听点好的", alias: "脑内吸猫", tags: ["治愈", "孤独", "ASMR", "难过"], tone: "听听这呼噜声，生活已经很硬了，我们需要一点软绵绵的安慰。" },
    { category: "听点好的", alias: "羊水节奏", tags: ["连接", "胎教", "平静", "胎动"], tone: "模拟一下宝宝在里面的混响效果，感受一下“同频呼吸”。" },
    { category: "避坑指南", alias: "快乐干饭手册", tags: ["饮食", "忌口", "营养", "饿", "想吃"], tone: "别盯着那盘螃蟹看了，过来看看这本手册，教你如何优雅地用别的美味填满胃。" },
    { category: "避坑指南", alias: "婆婆话术翻译机", tags: ["社交", "压力", "家庭", "婆婆", "长辈"], tone: "把“我都是为你好”翻译成“她在碎碎念”，心情是不是瞬间好多了？" },
    { category: "避坑指南", alias: "孕妈身材不焦虑", tags: ["形象", "自信", "科普", "胖", "肚子"], tone: "你不是胖了，你只是在进行一项伟大的“扩容工程”。进来看看怎么穿最飒。" },
    { category: "避坑指南", alias: "拆弹专家", tags: ["情绪", "争吵", "老公", "队友", "生气"], tone: "队友又脑抽了？来，三句话教你如何不战而屈人之兵。" },
    { category: "避坑指南", alias: "反内卷手册", tags: ["工作", "平衡", "心态", "办公", "加班"], tone: "医生说你现在最大的任务是长肉，不是冲业绩，快把那份PPT关了。" },
    { category: "心情感冒了", alias: "紧急充电宝", tags: ["崩溃", "大哭", "想死", "活不下去", "受不了"], tone: "电量报警了！别死撑，现在除了呼吸和哭，你什么都不用做，我陪着你。" },
    { category: "心情感冒了", alias: "解忧信箱", tags: ["绝望", "寻找光", "深度干预", "无助"], tone: "我在这儿呢。这封信是写给此时此刻的你的，拆开看看，咱们不聊具体的。" },
    { category: "心情感冒了", alias: "呼叫外援", tags: ["紧急", "专业", "连接", "医生"], tone: "今天的雨有点大，我请了专业的‘打伞人’（医生），你要不要跟他说两句？" },
    { category: "心情感冒了", alias: "情绪垃圾箱", tags: ["愤怒", "宣泄", "语音", "吐槽", "骂"], tone: "憋着会内伤。对着这个按钮吼两声，我保证不还嘴，也不告诉别人。" },
    { category: "心情感冒了", alias: "瞬间转移", tags: ["恐慌", "正念", "视觉化", "紧张"], tone: "想象你现在不在产检室，你在南极看企鹅。来，跟我深呼吸，数企鹅。" },
  ];

  // Logic priority: Emergency Mode (moodScore >= 70)
  if (moodScore >= 70) {
    const match = library.find(item => item.category === "心情感冒了" && item.tags.some(tag => text.includes(tag)));
    if (match) return { content: match.tone, status: 'emergency', alias: match.alias };
    return { content: "抱抱，我一直都在，想哭就哭出来吧。没事的，这里只有我们两个。先缓缓呼吸，好吗？", status: 'emergency', alias: "温暖陪伴" };
  }

  // Check for library matches first
  const match = library.find(item => item.tags.some(tag => text.includes(tag)));
  if (match) {
    const status = match.category === "心情感冒了" ? "emergency" : (moodScore >= 40 ? "warn" : "normal");
    return { content: match.tone, status, alias: match.alias };
  }

  // Fallback for warning level
  if (moodScore >= 40) {
    return { 
      content: "听起来你有压力。很多妈妈都懂这感觉。给你准备了正念，在『听点好的』里，要不要听听？产检快到了，需要提醒不？", 
      status: 'warn',
      alias: "耳朵抱抱"
    };
  }

  // Default normal responses
  if (text.includes('蹦迪')) {
    return { content: "宝宝在肚子里蹦迪，你打算在外面伴舞吗？放轻松，深呼吸一口。", status: 'normal' };
  }
  
  return { content: "我在呢。怎么啦？跟我说说今天有什么好玩的（或者想吐槽的）？", status: 'normal' };
};

const VoiceWave = () => (
  <div className="flex items-end justify-center h-12 gap-0.5">
    {[...Array(12)].map((_, i) => (
      <motion.div 
        key={i} 
        animate={{ height: [4, 24, 4] }}
        transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
        className="w-1 bg-pink-300 rounded-full mx-0.5" 
      />
    ))}
  </div>
);

const BubblesLoader = () => (
  <div className="flex gap-2 p-4">
    {[...Array(3)].map((_, i) => (
      <motion.div
        key={i}
        animate={{ 
          y: [-10, 10, -10],
          x: [-5, 5, -5],
          scale: [0.8, 1.2, 0.8]
        }}
        transition={{ 
          duration: 2 + i, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="w-4 h-4 rounded-full jelly-glass bg-pink-200/50"
      />
    ))}
  </div>
);

const FloatingBubble = ({ id, icon: Icon, label, color, delay = 0, onClick }: any) => (
  <motion.div
    layoutId={`bubble-${id}`}
    initial={{ opacity: 0, scale: 0, y: 100 }}
    animate={{ 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { delay, type: 'spring', damping: 15 }
    }}
    whileHover={{ scale: 1.2 }}
    whileTap={{ scale: 0.9 }}
    className="flex flex-col items-center gap-2 group cursor-pointer"
    onClick={onClick}
  >
    <motion.div 
      layoutId={`bubble-bg-${id}`}
      className={cn(
        "floating-bubble group-hover:shadow-[0_0_20px_5px_rgba(253,164,175,0.3)]",
        color
      )}
    >
      <Icon className="w-5 h-5 text-slate-500 group-hover:text-pink-500 transition-colors" />
    </motion.div>
    <span className="text-[10px] font-medium text-slate-400 group-hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-all">
      {label}
    </span>
  </motion.div>
);

const EmotionChart = ({ data }: { data: any[] }) => (
  <div className="h-24 w-full bg-white/20 backdrop-blur-md rounded-2xl p-2 border border-white/30">
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorWave" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#fda4af" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#fda4af" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <YAxis hide domain={[0, 100]} />
        <Area 
          type="monotone" 
          dataKey="score" 
          stroke="#fda4af" 
          fillOpacity={1} 
          fill="url(#colorWave)" 
          strokeWidth={2}
          isAnimationActive={true}
        />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);

const ViewEar = ({ items }: { items: any[] }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
    {items.map((item, i) => (
      <motion.div 
        key={i}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: i * 0.1 }}
        className="jelly-glass p-4 rounded-2xl flex items-center gap-4 hover:bg-white/40 transition-colors cursor-pointer group"
      >
        <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-500 group-hover:scale-110 transition-transform">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-slate-700">{item.alias}</p>
          <p className="text-[10px] text-slate-400">{item.tags.join(' / ')}</p>
        </div>
        <div className="w-8 h-8 rounded-full border border-pink-200 flex items-center justify-center text-pink-400">
           <Send className="w-3 h-3 rotate-90" />
        </div>
      </motion.div>
    ))}
  </div>
);

const ViewCompass = ({ items }: { items: any[] }) => (
  <div className="flex gap-6 overflow-x-auto pb-8 w-full max-w-4xl scrollbar-hide px-4">
    {items.map((item, i) => (
      <motion.div 
        key={i}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.1 }}
        className="min-w-[280px] jelly-glass p-6 rounded-3xl flex flex-col gap-4 bg-white/60 shadow-xl"
      >
        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500">
          <Compass className="w-6 h-6" />
        </div>
        <div>
          <h4 className="font-bold text-slate-800 mb-1">{item.alias}</h4>
          <p className="text-xs text-slate-500 leading-relaxed">{item.tone}</p>
        </div>
        <div className="mt-auto pt-4 border-t border-blue-50 flex justify-between items-center">
          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">{item.category}</span>
          <ArrowRight className="w-4 h-4 text-slate-300" />
        </div>
      </motion.div>
    ))}
  </div>
);

const ViewShield = () => (
  <div className="w-full max-w-sm jelly-glass p-8 rounded-[40px] flex flex-col items-center gap-6 bg-white/70">
    <div className="w-20 h-20 rounded-full bg-orange-50 flex items-center justify-center text-orange-400 relative">
      <ShieldAlert className="w-10 h-10" />
      <motion.div 
        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute inset-0 rounded-full bg-orange-200" 
      />
    </div>
    <div className="text-center">
      <h3 className="text-lg font-bold text-slate-800">专业温暖支持</h3>
      <p className="text-xs text-slate-500 mt-2">如果你感到特别不舒服，<br/>我们的专属医生随时准备陪伴你。</p>
    </div>
    <button className="w-full py-4 bg-orange-400 text-white rounded-2xl font-bold shadow-lg shadow-orange-200 active:scale-95 transition-all">
      开启面对面倾听
    </button>
    <p className="text-[10px] text-slate-400">温柔守护，即刻连接</p>
  </div>
);

const GuardianAngel = () => (
  <motion.div 
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    exit={{ scale: 0, opacity: 0 }}
    transition={{ type: 'spring', damping: 20, stiffness: 50 }}
    className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none"
  >
    <div className="relative w-[80%] aspect-square max-w-2xl flex items-center justify-center animate-drift">
      {/* Light Gloom */}
      <div className="absolute inset-0 guardian-angel-light animate-pulse-glow" />
      
      {/* Angel Shape (Abstract Minimalist) */}
      <svg width="400" height="400" viewBox="0 0 400 400" className="opacity-60 drop-shadow-[0_0_30px_rgba(255,255,255,0.8)]">
        {/* Halo */}
        <ellipse cx="200" cy="80" rx="40" ry="10" fill="none" stroke="white" strokeWidth="2" strokeOpacity="0.5" />
        {/* Head */}
        <circle cx="200" cy="110" r="20" fill="white" />
        {/* Wings / Arms (Open Embrace) */}
        <motion.path 
          d="M180 150 C120 120 40 180 40 240 C40 300 80 320 120 280 C150 250 180 200 200 180 C220 200 250 250 280 280 C320 320 360 300 360 240 C360 180 280 120 220 150 Z" 
          fill="white"
          animate={{ d: [
            "M180 150 C120 120 40 180 40 240 C40 300 80 320 120 280 C150 250 180 200 200 180 C220 200 250 250 280 280 C320 320 360 300 360 240 C360 180 280 120 220 150 Z",
            "M180 155 C125 125 45 185 45 245 C45 305 85 325 125 285 C155 255 185 205 200 185 C215 205 245 255 275 285 C315 325 355 305 355 245 C355 185 275 125 220 155 Z",
            "M180 150 C120 120 40 180 40 240 C40 300 80 320 120 280 C150 250 180 200 200 180 C220 200 250 250 280 280 C320 320 360 300 360 240 C360 180 280 120 220 150 Z"
          ]}}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Body */}
        <path d="M190 140 H210 L220 320 H180 Z" fill="white" fillOpacity="0.8" />
      </svg>
    </div>
  </motion.div>
);

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'ai',
      content: '嗨，亲爱的。今天感觉怎么样？是想找我吐槽，还是想让我夸夸你？',
      timestamp: new Date(),
      stage: 'ready'
    }
  ]);
  const [isRecording, setIsRecording] = useState(false);
  const [moodLevel, setMoodLevel] = useState<MoodLevel>('normal');
  const [showAnalysis, setShowAnalysis] = useState(false); 
  const [moodHistory, setMoodHistory] = useState([{ score: 20 }, { score: 35 }, { score: 25 }]);
  const [isThinking, setIsThinking] = useState(false);
  const [activeView, setActiveView] = useState<string | null>(null);
  const [showHeart, setShowHeart] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const library = [
    { category: "听点好的", alias: "耳朵抱抱", tags: ["入睡", "解压", "白噪音", "失眠", "睡不着"], tone: "把脑子里的弹幕关掉，现在是强制关机时间，听完这首准时打呼。" },
    { category: "听点好的", alias: "深海潜水", tags: ["冥想", "焦虑", "波动", "不安", "5分钟"], tone: "别在岸上纠结了，跟我去深海吐个泡泡，把烦心事都淹死。" },
    { category: "听点好的", alias: "云端漫步", tags: ["放松", "白日梦", "轻音乐", "休息"], tone: "既然不能去蹦迪，就去云彩上踩两脚。这节奏，宝宝听了都想躺平。" },
    { category: "听点好的", alias: "脑内吸猫", tags: ["治愈", "孤独", "ASMR", "难过"], tone: "听听这呼噜声，生活已经很硬了，我们需要一点软绵绵的安慰。" },
    { category: "听点好的", alias: "羊水节奏", tags: ["连接", "胎教", "平静", "胎动"], tone: "模拟一下宝宝在里面的混响效果，感受一下“同频呼吸”。" },
    { category: "避坑指南", alias: "快乐干饭手册", tags: ["饮食", "忌口", "营养", "饿", "想吃"], tone: "别盯着那盘螃蟹看了，过来看看这本手册，教你如何优雅地用别的美味填满胃。" },
    { category: "避坑指南", alias: "婆婆话术翻译机", tags: ["社交", "压力", "家庭", "婆婆", "长辈"], tone: "把“我都是为你好”翻译成“她在碎碎念”，心情是不是瞬间好多了？" },
    { category: "避坑指南", alias: "孕妈身材不焦虑", tags: ["形象", "自信", "科普", "胖", "肚子"], tone: "你不是胖了，你只是在进行一项伟大的“扩容工程”。进来看看怎么穿最飒。" },
    { category: "避坑指南", alias: "拆弹专家", tags: ["情绪", "争吵", "老公", "队友", "生气"], tone: "队友又脑抽了？来，三句话教你如何不战而屈人之兵。" },
    { category: "避坑指南", alias: "反内卷手册", tags: ["工作", "平衡", "心态", "办公", "加班"], tone: "医生说你现在最大的任务是长肉，不是冲业绩，快把那份PPT关了。" },
    { category: "心情感冒了", alias: "紧急充电宝", tags: ["崩溃", "大哭", "想死", "活不下去", "受不了"], tone: "电量报警了！别死撑，现在除了呼吸和哭，你什么都不用做，我陪着你。" },
    { category: "心情感冒了", alias: "解忧信箱", tags: ["绝望", "寻找光", "深度干预", "无助"], tone: "我在这儿呢。这封信是写给此时此刻的你的，拆开看看，咱们不聊具体的。" },
    { category: "心情感冒了", alias: "呼叫外援", tags: ["紧急", "专业", "连接", "医生"], tone: "今天的雨有点大，我请了专业的‘打伞人’（医生），你要不要跟他说两句？" },
    { category: "心情感冒了", alias: "情绪垃圾箱", tags: ["愤怒", "宣泄", "语音", "吐槽", "骂"], tone: "憋着会内伤。对着这个按钮吼两声，我保证不还嘴，也不告诉别人。" },
    { category: "心情感冒了", alias: "瞬间转移", tags: ["恐慌", "正念", "视觉化", "紧张"], tone: "想象你现在不在产检室，你在南极看企鹅。来，跟我深呼吸，数企鹅。" },
  ];

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  const handleVoiceSend = () => {
    setIsRecording(false);
    
    // Simulate user text from voice
    const mockUserTexts = [
      "宝宝最近动得有点频繁，我有点睡不着...",
      "我真的好烦，感觉全家人都在盯着我的肚子。",
      "今天产检医生说一切都好，心情瞬间放晴了。",
      "最近总是很焦虑，担心以后带不好孩子。",
      "感觉老公一点都不理解我的压力，好崩溃。"
    ];
    const text = mockUserTexts[Math.floor(Math.random() * mockUserTexts.length)];

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
      stage: 'floating'
    };

    setMessages(prev => [...prev, userMsg]);
    setIsThinking(true);

    // After animation, process AI response
    setTimeout(() => {
      let score = Math.floor(Math.random() * 40);
      if (text.includes('烦') || text.includes('不着')) score = 55;
      if (text.includes('崩溃') || text.includes('死')) score = 85;

      const response = getAiResponse(text, score);
      const analysis = `[状态分析]：${score >= 70 ? '严重低落' : score >= 40 ? '轻度焦虑' : '状态平稳'} / 风险分值: ${score}`;
      
      setIsThinking(false);
      
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: response.content,
        timestamp: new Date(),
        statusLog: analysis,
        alias: response.alias,
        stage: 'merging'
      };

      setMoodLevel(response.status);
      setMessages(prev => [...prev.map(m => m.id === userMsg.id ? { ...m, stage: 'ready' } : m), aiMsg]);
      setMoodHistory(prev => [...prev, { score }].slice(-10));
      
      setTimeout(() => {
        setMessages(prev => prev.map(m => m.id === aiMsg.id ? { ...m, stage: 'ready' } : m));
      }, 800);
    }, 2000);
  };

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-1000 flex flex-col items-center justify-center p-4 relative overflow-hidden",
      moodLevel === 'emergency' ? "bg-bg-emergency" : "bg-watercolor-cream"
    )}>
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], x: [0, 50, 0], y: [0, -50, 0] }}
          transition={{ duration: 20, repeat: Infinity }}
          className={cn("absolute -top-40 -left-40 w-96 h-96 rounded-full blur-[100px]", moodLevel === 'emergency' ? "bg-orange-100/40" : "bg-pink-100/50")} 
        />
        <motion.div 
          animate={{ scale: [1, 1.3, 1], x: [0, -50, 0], y: [0, 50, 0] }}
          transition={{ duration: 15, repeat: Infinity }}
          className={cn("absolute -bottom-40 -right-40 w-96 h-96 rounded-full blur-[100px]", moodLevel === 'emergency' ? "bg-rose-100/40" : "bg-purple-100/50")} 
        />
      </div>

      <AnimatePresence>
        {moodLevel === 'emergency' && <GuardianAngel />}
      </AnimatePresence>

      <main className="relative w-full max-w-xl h-[90vh] flex flex-col gap-4">
        {/* Header (Hidden or faded in emergency) */}
        <motion.div 
          animate={{ opacity: moodLevel === 'emergency' ? 0.3 : 1 }}
          className="flex items-center justify-between px-2 mb-4 z-10"
        >
          <div className="flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center jelly-glass text-pink-300", moodLevel === 'emergency' && "text-orange-300")}>
              <Heart className="w-5 h-5 fill-current" />
            </div>
            <h1 className={cn("text-sm font-semibold tracking-wide", moodLevel === 'emergency' ? "text-orange-800/60" : "text-slate-500")}>树洞随想</h1>
          </div>
          <button onClick={() => setShowAnalysis(!showAnalysis)}>
             <Activity className="w-4 h-4 text-slate-300" />
          </button>
        </motion.div>

        {/* Chat Stream */}
        <div className={cn(
          "flex-1 overflow-y-auto scrollbar-hide px-4 pt-10 pb-32 transition-all duration-700",
          moodLevel === 'emergency' ? "blur-[2px] opacity-40 scale-95" : ""
        )}>
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                className={cn(
                  "flex flex-col max-w-[90%] relative space-y-12 mb-12",
                  msg.role === 'user' ? "self-end items-end" : "self-start items-start",
                  msg.stage === 'floating' && "animate-bubble-up"
                )}
              >
                {msg.statusLog && showAnalysis && (
                  <div className="absolute -top-6 left-0 text-[10px] font-mono text-emerald-500 opacity-70 whitespace-nowrap bg-black/5 px-2 rounded">
                    {msg.statusLog}
                  </div>
                )}

                <div className={cn(
                  "bubble-text",
                  msg.role === 'user' ? "bg-white/50 text-slate-600 rounded-tr-none" : "rounded-tl-none",
                  msg.stage === 'merging' && "animate-merge"
                )}>
                  {msg.alias && (
                    <div className="absolute -top-4 -left-2 px-2 py-0.5 rounded-full bg-pink-400 text-[10px] text-white font-bold animate-bounce shadow-lg z-20">
                      {msg.alias}
                    </div>
                  )}
                  {msg.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {isThinking && (
            <div className="self-start">
              <BubblesLoader />
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Emergency Mode Centered Overlay */}
        <AnimatePresence>
          {moodLevel === 'emergency' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-8 pointer-events-none z-40"
            >
              <motion.div 
                 initial={{ y: 50, opacity: 0 }}
                 animate={{ y: 0, opacity: 1 }}
                 transition={{ delay: 0.5 }}
                 className="jelly-glass p-8 rounded-[40px] shadow-2xl bg-white/40 backdrop-blur-3xl border-white/60 pointer-events-auto max-w-[85%] text-center"
              >
                 <Sparkles className="w-8 h-8 text-orange-400 mb-4 mx-auto" />
                 <p className="text-lg font-medium text-slate-800 leading-relaxed">
                   {messages[messages.length - 1]?.role === 'ai' ? messages[messages.length - 1].content : "抱抱，我在这儿呢。"}
                 </p>
                 <div className="mt-8 flex justify-center gap-3">
                    {[1, 2, 3].map(i => (
                      <motion.div 
                        key={i}
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                        className="w-2 h-2 rounded-full bg-orange-200" 
                      />
                    ))}
                 </div>
              </motion.div>

              {/* BGM Visual Indicator */}
              <motion.div 
                 initial={{ scale: 0 }}
                 animate={{ scale: 1 }}
                 className="flex items-center gap-2 jelly-glass px-4 py-2 rounded-full"
              >
                 <Activity className="w-3 h-3 text-orange-400 animate-pulse" />
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Healing Ambient</span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Exit Heart Animation */}
        <AnimatePresence>
          {showHeart && (
            <motion.div 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1.5, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[200] pointer-events-none"
            >
              <Heart className="w-32 h-32 text-pink-400 fill-current" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Actions */}
        <motion.div 
          animate={{ opacity: moodLevel === 'emergency' ? 0.2 : 1 }}
          className="absolute right-0 top-1/4 flex flex-col gap-6 pr-2 z-10"
        >
           <FloatingBubble id="zap" icon={Zap} label="心情脚印" color="text-yellow-400" onClick={() => setActiveView('zap')} />
           <FloatingBubble id="compass" icon={Compass} label="避坑指南" color="text-blue-400" onClick={() => setActiveView('compass')} />
           <FloatingBubble id="ear" icon={Ear} label="听点好的" color="text-purple-400" onClick={() => setActiveView('ear')} />
           <FloatingBubble id="shield" icon={ShieldAlert} label="专业支持" color={moodLevel === 'emergency' ? "text-orange-400" : "text-slate-400"} onClick={() => setActiveView('shield')} />
        </motion.div>

        {/* Immersive View Overlay */}
        <AnimatePresence>
          {activeView && (
            <motion.div 
              layoutId={`bubble-bg-${activeView}`}
              className="fixed inset-0 z-[100] immersive-overlay bg-white/90 backdrop-blur-3xl overflow-hidden"
              initial={{ borderRadius: 1000 }}
              animate={{ borderRadius: 0 }}
              exit={{ borderRadius: 1000 }}
            >
              <motion.button 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setActiveView(null)}
                className="absolute top-10 right-10 w-12 h-12 rounded-full jelly-glass flex items-center justify-center text-slate-400 hover:text-pink-500 transition-colors"
              >
                <ArrowRight className="w-6 h-6 rotate-180" />
              </motion.button>

              <div className="w-full flex flex-col items-center gap-12">
                <motion.div 
                   layoutId={`bubble-icon-${activeView}`}
                   className="w-16 h-16 rounded-full jelly-glass flex items-center justify-center"
                >
                   {activeView === 'zap' && <Zap className="w-8 h-8 text-yellow-400" />}
                   {activeView === 'compass' && <Compass className="w-8 h-8 text-blue-400" />}
                   {activeView === 'ear' && <Ear className="w-8 h-8 text-purple-400" />}
                   {activeView === 'shield' && <ShieldAlert className="w-8 h-8 text-rose-500" />}
                </motion.div>

                <div className="w-full flex justify-center">
                  {activeView === 'ear' && <ViewEar items={library.filter(i => i.category === '听点好的')} />}
                  {activeView === 'compass' && <ViewCompass items={library.filter(i => i.category === '避坑指南')} />}
                  {activeView === 'shield' && <ViewShield />}
                  {activeView === 'zap' && (
                    <div className="w-full max-w-sm jelly-glass p-8 rounded-3xl">
                      <h3 className="font-bold text-slate-800 mb-6">本周情绪浪潮</h3>
                      <EmotionChart data={moodHistory} />
                      <div className="mt-8 space-y-4">
                         <div className="flex justify-between text-xs font-medium">
                            <span className="text-slate-400">平均分：</span>
                            <span className="text-slate-700">62.5 (良好)</span>
                         </div>
                         <div className="flex justify-between text-xs font-medium">
                            <span className="text-slate-400">主要标签：</span>
                            <span className="text-pink-500 font-bold">期待 / 略显疲惫</span>
                         </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Voice Interaction Bubble */}
        <div className="fixed bottom-12 right-6 md:right-12 flex flex-col items-end gap-4 z-50">
          <AnimatePresence>
            {isRecording && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                className="jelly-glass px-6 py-4 rounded-[32px] mb-4 flex items-center gap-6 bg-white/60 shadow-2xl"
              >
                <VoiceWave />
                <button 
                  onClick={handleVoiceSend}
                  className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-2 rounded-full text-xs font-bold transition-all shadow-lg active:scale-95"
                >
                  说完啦
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            onClick={() => setIsRecording(!isRecording)}
            className={cn(
              "w-24 h-24 rounded-full flex flex-col items-center justify-center gap-1 transition-all shadow-[0_20px_50px_rgba(0,0,0,0.1)] active:scale-90 border-4 border-white/50",
              isRecording ? "bg-pink-100 scale-110" : "bg-white/80"
            )}
          >
            <div className={cn("w-3 h-3 rounded-full mb-1", isRecording ? "bg-red-500 animate-pulse" : "bg-pink-400")} />
            <span className="text-sm font-bold text-pink-500">倾诉</span>
          </button>
        </div>

        {/* Battery Indicator */}
        <div className="flex justify-center mt-auto mb-10 z-10 opacity-30">
          <div className="flex flex-col items-center gap-2">
            <div className="w-40 h-2 bg-slate-200/50 rounded-full overflow-hidden jelly-glass">
              <motion.div 
                animate={{ width: `${100 - (moodHistory[moodHistory.length-1]?.score || 0)}%` }}
                className={cn("h-full transition-all duration-1000", moodLevel === 'emergency' ? "bg-orange-300" : "bg-teal-400")} 
              />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">守护状态</span>
          </div>
        </div>

      {/* Emergency Mode Overlay is now handled by GuardianAngel and centering logic above */}
      </main>

      {/* Demo Controls */}
      <div className="fixed bottom-4 left-4 flex items-center gap-3 px-4 py-2 bg-white/30 backdrop-blur rounded-full border border-white/50 opacity-10 hover:opacity-100 transition-opacity z-50">
         <button 
           onClick={() => {
             if (moodLevel === 'emergency') {
               setShowHeart(true);
               setTimeout(() => {
                 setMoodLevel('normal');
                 setShowHeart(false);
               }, 1500);
             } else {
               setMoodLevel('normal');
             }
           }} 
           className="w-4 h-4 rounded-full bg-teal-400 border-2 border-white" 
         />
         <button onClick={() => setMoodLevel('emergency')} className="w-4 h-4 rounded-full bg-orange-300 border-2 border-white" />
      </div>
    </div>
  );
}
