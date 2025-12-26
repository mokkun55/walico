import { useState } from 'react';
import { Camera, Keyboard, Share2, Check, ChevronDown, ChevronUp, X, Receipt, Wallet, ArrowRight } from 'lucide-react';

/**
 * WALICO PROTOYPE
 * コンセプト: 3秒で完結。履歴なし。No Login.
 * テーマカラー: Smart Mint (Emerald-500)
 */

type ViewState = 'HOME' | 'SCANNING' | 'EDIT' | 'COMPLETED' | 'RECEIVER';

export default function App() {
  const [view, setView] = useState<ViewState>('HOME');
  const [loading, setLoading] = useState(false);

  // --- STATE FOR EDIT SCREEN ---
  const [totalAmount] = useState(8600);
  const [ratio, setRatio] = useState(50); // 50%
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isPaid, setIsPaid] = useState(false);

  // 相手への請求額計算
  const requestAmount = Math.ceil((totalAmount * (100 - ratio) / 100));

  // 画面遷移ハンドラー
  const startScan = () => {
    setView('SCANNING');
    // AI解析の疑似ローディング (1.5秒)
    setTimeout(() => {
      setView('EDIT');
    }, 1500);
  };

  const sendLine = () => {
    setLoading(true);
    // 送信処理の疑似ローディング
    setTimeout(() => {
      setLoading(false);
      setView('COMPLETED');
    }, 1000);
  };

  // --- COMPONENTS ---

  // 1. ホーム画面 (Zero UI)
  const HomeScreen = () => (
    <div className="flex flex-col h-screen bg-white relative overflow-hidden">
      {/* Settings / Menu Icon */}
      <div className="absolute top-0 right-0 p-6 z-10">
        <button type="button" className="p-2 text-gray-400 hover:text-emerald-500 transition-colors">
          <div className="w-6 h-6 border-2 border-current rounded-full border-dashed animate-spin-slow" />
        </button>
      </div>

      {/* Center Branding */}
      <div className="flex-1 flex flex-col items-center justify-center -mt-20">
        <div className="mb-6 relative">
          <div className="absolute -inset-4 bg-emerald-100 rounded-full blur-2xl opacity-50"></div>
          <div className="relative w-24 h-24 bg-gradient-to-tr from-emerald-400 to-teal-500 rounded-[2rem] shadow-xl flex items-center justify-center transform rotate-3">
            <span className="text-4xl font-bold text-white tracking-tighter">Wa</span>
          </div>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight mb-2">Walico</h1>
        <p className="text-gray-400 text-sm font-medium tracking-widest uppercase">3秒で割り勘。</p>
        
        {/* Resume Action (Conditional) */}
        {/* <div className="mt-8 px-4 py-2 bg-emerald-50 rounded-full text-emerald-600 text-xs font-bold flex items-center gap-2 cursor-pointer hover:bg-emerald-100 transition">
          <RefreshCw size={12} />
          前回の続きから再開
        </div> */}
      </div>

      {/* Action Dock (Floating) */}
      <div className="p-6 pb-10 w-full max-w-md mx-auto relative z-20">
        <button 
          type="button"
          onClick={startScan}
          className="group w-full h-20 bg-emerald-500 hover:bg-emerald-600 active:scale-95 transition-all duration-200 rounded-[2rem] shadow-xl shadow-emerald-200 flex items-center justify-between px-8 relative overflow-hidden"
        >
          {/* Shine Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:animate-shine" />
          
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-2.5 rounded-xl">
              <Camera className="text-white w-6 h-6" />
            </div>
            <span className="text-white text-xl font-bold tracking-wide">レシートを撮影</span>
          </div>
          <ArrowRight className="text-white/70 w-6 h-6 group-hover:translate-x-1 transition-transform" />
        </button>

        <button 
          type="button"
          onClick={() => setView('EDIT')}
          className="w-full mt-6 text-center text-gray-400 text-sm font-medium hover:text-emerald-500 transition-colors flex items-center justify-center gap-2"
        >
          <Keyboard size={16} />
          <span>手入力ではじめる</span>
        </button>
      </div>
    </div>
  );

  // 2. スキャン画面 (Loading)
  const ScanningScreen = () => (
    <div className="h-screen bg-gray-900 flex flex-col items-center justify-center relative">
      {/* biome-ignore lint/performance/noImgElement: サンプルコードのため通常のimgタグを使用 */}
      <img 
        src="https://images.unsplash.com/photo-1559144490-8d2495406080?auto=format&fit=crop&q=80&w=800" 
        className="absolute inset-0 w-full h-full object-cover opacity-40 blur-sm"
        alt="Receipt"
      />
      <div className="absolute inset-0 bg-scan-line animate-scan"></div>
      
      <div className="relative z-10 flex flex-col items-center">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-white font-bold text-lg animate-pulse">AI解析中...</p>
        <p className="text-emerald-300 text-xs mt-2">Gemini 2.0 Flash is thinking</p>
      </div>
    </div>
  );

  // 3. 編集画面 (Hybrid UI)
  const EditScreen = () => (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white px-6 pt-12 pb-4 shadow-sm z-10">
        <div className="flex justify-between items-start mb-1">
          <div>
            <input 
              type="text" 
              defaultValue="焼肉トラジ 恵比寿店" 
              className="text-gray-800 font-bold text-lg bg-transparent border-none p-0 focus:ring-0 w-full"
            />
            <p className="text-gray-400 text-xs">2024.12.26 19:30</p>
          </div>
          <button type="button" onClick={() => setView('HOME')} className="p-2 -mr-2 text-gray-400">
            <X size={24} />
          </button>
        </div>
        
        {/* Total Amount Display */}
        <div className="mt-6 flex items-baseline gap-2">
          <span className="text-gray-500 text-sm font-bold">合計</span>
          <span className="text-4xl font-extrabold text-gray-900 tracking-tight">¥{totalAmount.toLocaleString()}</span>
        </div>
      </div>

      {/* Main Scroll Area */}
      <div className="flex-1 overflow-y-auto pb-32">
        {/* Slider Card */}
        <div className="m-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-end mb-6">
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1 font-bold">あなた</p>
              <p className="text-xl font-bold text-gray-700">{ratio}%</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-emerald-500 mb-1 font-bold">相手への請求</p>
              <p className="text-3xl font-extrabold text-emerald-500">¥{requestAmount.toLocaleString()}</p>
            </div>
          </div>

          <input 
            type="range" 
            min="0" 
            max="100" 
            step="5"
            value={ratio} 
            onChange={(e) => setRatio(Number(e.target.value))}
            className="w-full h-3 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-600"
          />
          <div className="flex justify-between mt-4">
             <button type="button" onClick={() => setRatio(50)} className="px-3 py-1 rounded-full bg-gray-100 text-xs font-bold text-gray-500 hover:bg-gray-200">50:50</button>
             <button type="button" className="px-3 py-1 rounded-full bg-emerald-50 text-xs font-bold text-emerald-600 hover:bg-emerald-100">端数切上</button>
          </div>
        </div>

        {/* Detail Accordion */}
        <div className="mx-4">
          <button 
            type="button"
            onClick={() => setIsDetailOpen(!isDetailOpen)}
            className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm text-gray-600 font-bold text-sm"
          >
            <span className="flex items-center gap-2">
              <Receipt size={16} className="text-emerald-500"/>
              明細を確認・編集
            </span>
            {isDetailOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>

          {isDetailOpen && (
            <div className="mt-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-slideDown">
              {[
                { name: "上タン塩", price: 1680 },
                { name: "ハラミ", price: 1200 },
                { name: "生ビール x2", price: 1200 },
                { name: "石焼ビビンバ", price: 980 },
                { name: "チョレギサラダ", price: 840 },
                { name: "ウーロン茶", price: 400 },
              ].map((item) => (
                <div key={`${item.name}-${item.price}`} className="flex justify-between items-center p-4 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-bold text-gray-700">{item.name}</p>
                    <p className="text-xs text-gray-400">¥{item.price.toLocaleString()}</p>
                  </div>
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button type="button" className="px-3 py-1 text-xs font-bold rounded-md bg-white shadow-sm text-emerald-600">割</button>
                    <button type="button" className="px-3 py-1 text-xs font-bold rounded-md text-gray-400">自</button>
                    <button type="button" className="px-3 py-1 text-xs font-bold rounded-md text-gray-400">相</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer Action */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-gray-100">
        <button 
          type="button"
          onClick={sendLine}
          disabled={loading}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-lg py-4 rounded-2xl shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          {loading ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Share2 size={20} />
              <span>LINEで請求 (¥{requestAmount.toLocaleString()})</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  // 4. 送信完了画面 (デモ用)
  const CompletedScreen = () => (
    <div className="h-screen bg-emerald-500 flex flex-col items-center justify-center p-6 text-center text-white">
      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 animate-bounce">
        <Check size={40} className="text-emerald-500" />
      </div>
      <h2 className="text-3xl font-bold mb-2">送信完了！</h2>
      <p className="text-emerald-100 mb-8">LINEアプリが起動しました。</p>
      
      <div className="space-y-4 w-full max-w-xs">
        <button 
          type="button"
          onClick={() => setView('RECEIVER')}
          className="w-full py-3 bg-white/20 hover:bg-white/30 rounded-xl font-bold border border-white/40"
        >
          [デモ] 相手の画面を見る
        </button>
        <button 
          type="button"
          onClick={() => setView('HOME')}
          className="w-full py-3 text-emerald-100 hover:text-white font-bold text-sm"
        >
          ホームに戻る
        </button>
      </div>
    </div>
  );

  // 5. 相手側ビュー (Receiver View)
  const ReceiverScreen = () => (
    <div className="h-screen bg-gray-50 flex flex-col">
       {/* Hero Section */}
       <div className="bg-white pb-8 pt-12 px-6 rounded-b-[2.5rem] shadow-sm z-10 text-center relative overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500"></div>
         <p className="text-sm font-bold text-gray-400 mb-2">焼肉トラジ 恵比寿店</p>
         <p className="text-xs text-gray-300 mb-6">2024.12.26</p>
         
         <div className="mb-2">
            <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">お支払い金額</span>
         </div>
         <h1 className="text-5xl font-extrabold text-gray-800 tracking-tight mb-2">
           <span className="text-2xl align-top mr-1">¥</span>
           {requestAmount.toLocaleString()}
         </h1>
       </div>

       {/* Content */}
       <div className="flex-1 overflow-y-auto p-6 space-y-4">
         {/* Message Bubble */}
         <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-gray-100 ml-2 relative">
            <div className="absolute -top-[1px] -left-2 w-4 h-4 bg-white [clip-path:polygon(100%_0,0_0,100%_100%)]"></div>
            <p className="text-gray-600 text-sm leading-relaxed">
              昨日はありがとう！立て替えておいた分です。確認よろしく🙏
            </p>
         </div>

         {/* Receipt Image Button */}
         <button type="button" className="w-full bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group hover:border-emerald-200 transition-colors">
            <div className="flex items-center gap-3">
              <div className="bg-gray-100 p-2 rounded-lg text-gray-500">
                <Receipt size={20} />
              </div>
              <div className="text-left">
                <p className="font-bold text-gray-700 text-sm">レシート画像</p>
                <p className="text-xs text-gray-400">有効期限: あと6日</p>
              </div>
            </div>
            <ArrowRight size={16} className="text-gray-300 group-hover:text-emerald-500" />
         </button>

         {/* Breakdown */}
         <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
           <h3 className="font-bold text-gray-800 text-sm mb-4">計算の内訳</h3>
           <div className="space-y-3 text-sm">
             <div className="flex justify-between">
               <span className="text-gray-500">会計合計</span>
               <span className="font-medium">¥{totalAmount.toLocaleString()}</span>
             </div>
             <div className="flex justify-between">
               <span className="text-gray-500">負担率</span>
               <span className="font-medium">{(100-ratio)}% (あなた)</span>
             </div>
             <div className="h-px bg-gray-100 my-2"></div>
             <div className="flex justify-between text-emerald-600 font-bold">
               <span>請求額</span>
               <span>¥{requestAmount.toLocaleString()}</span>
             </div>
           </div>
         </div>
       </div>

       {/* Action Footer */}
       <div className="p-4 bg-white border-t border-gray-100">
         {!isPaid ? (
           <button 
             type="button"
             onClick={() => setIsPaid(true)}
             className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-lg py-4 rounded-2xl shadow-lg shadow-emerald-200 active:scale-95 transition-all flex items-center justify-center gap-2"
           >
             <Wallet size={20} />
             支払いを完了する
           </button>
         ) : (
           <button 
             type="button"
             disabled
             className="w-full bg-gray-100 text-gray-400 font-bold text-lg py-4 rounded-2xl flex items-center justify-center gap-2 cursor-not-allowed"
           >
             <Check size={20} />
             支払い済み
           </button>
         )}
         {/* PayPay Link Mock */}
         <div className="mt-4 text-center">
            <button type="button" className="text-xs text-gray-400 underline font-medium hover:text-emerald-500">
               PayPayアプリを開く
            </button>
         </div>
       </div>
    </div>
  );

  // VIEW ROUTING
  switch (view) {
    case 'SCANNING': return <ScanningScreen />;
    case 'EDIT': return <EditScreen />;
    case 'COMPLETED': return <CompletedScreen />;
    case 'RECEIVER': return <ReceiverScreen />;
    default: return <HomeScreen />;
  }
}