import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Sparkles, 
  ArrowRight, 
  ChevronRight, 
  ShieldCheck, 
  Clock, 
  Bot, 
  Zap, 
  Layers, 
  CheckCircle2, 
  MessageSquare,
  Key,
  Eye,
  EyeOff,
  Check,
  X,
  Loader2
} from "lucide-react";

interface ScmLandingProps {
  onStartSimulator: () => void;
  onLaunchPreset: (part: string, situation: string) => void;
  geminiApiKey: string;
  onUpdateApiKey: (key: string) => void;
}

export default function ScmLanding({ 
  onStartSimulator, 
  onLaunchPreset,
  geminiApiKey,
  onUpdateApiKey
}: ScmLandingProps) {
  const [inputKey, setInputKey] = useState(geminiApiKey);
  const [showPassword, setShowPassword] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [validationError, setValidationError] = useState('');

  // Update inputKey if prop changes
  useEffect(() => {
    setInputKey(geminiApiKey);
  }, [geminiApiKey]);

  const handleValidateAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputKey.trim()) return;
    
    setIsValidating(true);
    setValidationStatus('idle');
    setValidationError('');
    
    try {
      const res = await fetch("/api/gemini/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: inputKey.trim() })
      });
      
      const data = await res.json();
      if (res.ok && data.valid) {
        setValidationStatus('success');
        onUpdateApiKey(inputKey.trim());
      } else {
        setValidationStatus('error');
        setValidationError(data.error || "올바르지 않은 API Key입니다.");
      }
    } catch (err: any) {
      setValidationStatus('error');
      setValidationError(err.message || "연결 오류가 발생했습니다.");
    } finally {
      setIsValidating(false);
    }
  };

  const handleResetKey = () => {
    setInputKey('');
    setValidationStatus('idle');
    setValidationError('');
    onUpdateApiKey('');
  };

  const scrollToKeySection = () => {
    const element = document.getElementById("gemini-key-section");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      const input = document.querySelector('input[placeholder*="Gemini API Key"], input[type="password"], input[type="text"]') as HTMLInputElement;
      if (input) {
        setTimeout(() => {
          input.focus();
          input.classList.add("ring-2", "ring-orange-500", "border-orange-500");
          setTimeout(() => {
            input.classList.remove("ring-2", "ring-orange-500", "border-orange-500");
          }, 2000);
        }, 800);
      }
    }
  };

  return (
    <div className="flex-1 w-full bg-[#070a13]" id="landing-page">
      {/* API Key Required Global Top Banner */}
      {!geminiApiKey && (
        <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border-b border-orange-500/30 px-6 py-3.5 text-center flex flex-col sm:flex-row items-center justify-center gap-3.5 relative z-30" id="api-warning-banner">
          <span className="text-xs md:text-sm font-bold text-orange-300 flex items-center gap-2">
            <Key className="w-4 h-4 animate-pulse text-orange-400" />
            현재 Gemini API Key 승인을 받지 않았습니다. 모든 핵심 시뮬레이터 및 AI 진단 기능을 잠금 해제하려면 먼저 API Key 승인이 필요합니다.
          </span>
          <button
            onClick={scrollToKeySection}
            className="px-4 py-1.5 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-extrabold rounded-lg text-xs transition-all duration-200 cursor-pointer shadow-md flex items-center gap-1.5"
          >
            API 승인받으러 가기
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 md:py-24 px-6 border-b border-slate-800/50 bg-[#090f1d]" id="hero-section">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.06),transparent_45%)] pointer-events-none"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(56,189,248,0.04),transparent_45%)] pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-6 md:space-y-8 text-left">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex"
            >
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 text-orange-400 text-xs font-extrabold border border-orange-500/20 tracking-wider uppercase shadow-inner">
                <Sparkles className="w-3.5 h-3.5 animate-pulse text-orange-500" />
                글로벌 공급망 리스크 AI 관제 플랫폼
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="space-y-4"
            >
              <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight md:leading-tight">
                부품 수급 지연 위기,<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-500 to-amber-500 underline decoration-orange-500/40 decoration-4 underline-offset-8">
                  단 5초 만에 최적의 조치안
                </span>을 설계합니다
              </h2>
              <p className="text-sm md:text-lg text-slate-300 leading-relaxed font-medium">
                돌발 부품 지연 소식에 속수무책으로 라인이 중단되던 시대는 끝났습니다. 15년 경력의 생산계획 지식베이스와 SCM 대응 시나리오 알고리즘을 결합하여, 사내 재고를 실시간 계산하고 최적의 대체 조달 및 혼류 가동 대안을 자동 수립해 드립니다.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col sm:flex-row items-center justify-start gap-4 pt-4"
            >
              <button
                onClick={geminiApiKey ? onStartSimulator : scrollToKeySection}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-extrabold rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-3 shadow-lg shadow-orange-900/20 active:scale-95 group text-base"
              >
                {!geminiApiKey ? "API Key 연동 후 시뮬레이터 가동" : "AI 최적화 시뮬레이터 가동하기"}
                {geminiApiKey ? (
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                ) : (
                  <Key className="w-4 h-4 text-orange-200 animate-pulse" />
                )}
              </button>
              <a
                href="#trial-zone"
                className="w-full sm:w-auto px-8 py-4 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 hover:text-white font-bold rounded-xl border border-slate-700 transition-all duration-200 cursor-pointer flex items-center justify-center text-sm"
              >
                실제 긴급 사례 체험하기
              </a>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex flex-wrap items-center justify-start gap-x-6 gap-y-3 pt-6 border-t border-slate-800/40 text-xs text-slate-400 font-medium"
            >
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" /> Pretendard 고해상도 서체 적용
              </span>
              <span className="text-slate-700">•</span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-orange-400" /> 24시간 현장 대응 To-Do 연동
              </span>
              <span className="text-slate-700">•</span>
              <span className="flex items-center gap-1.5">
                <Bot className="w-4 h-4 text-blue-400" /> 1:1 대화형 SCM 멘토링 즉시 제공
              </span>
            </motion.div>
          </div>

          {/* Right Image Column (Visualizing Smart Factory Automation) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="lg:col-span-5 relative group"
          >
            <div className="absolute -inset-1.5 bg-gradient-to-r from-orange-500 via-amber-500 to-blue-500 rounded-3xl blur opacity-30 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-[#0b0f19] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
              <img
                src="/src/assets/images/factory_robot_1783404690885.jpg"
                alt="SCM Smart Factory Robotic Automation"
                className="w-full h-[320px] md:h-[450px] object-cover hover:scale-105 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#080d1a]/95 via-transparent to-transparent pointer-events-none"></div>
              <div className="absolute bottom-4 left-4 right-4 bg-slate-950/80 backdrop-blur-md border border-slate-800 p-4.5 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-black text-orange-400 uppercase tracking-widest">LIVE SCM CONTEXT</div>
                  <div className="text-xs font-bold text-white mt-0.5">정밀 로봇 및 스마트 생산 라인 시뮬레이션</div>
                </div>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
            </div>
          </motion.div>

        </div>
      </section>

      {/* Gemini API Key Configuration Section */}
      <section className="py-8 px-6 max-w-7xl mx-auto -mt-6 relative z-20" id="gemini-key-section">
        <div className="bg-[#0f172a]/95 backdrop-blur-md border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-orange-500/10 text-orange-400 px-3.5 py-1 text-[10px] font-black tracking-widest uppercase border-l border-b border-slate-800 rounded-bl-xl">
            SECURITY KEY CONSOLE
          </div>
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl text-left">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400">
                  <Key className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-black text-white">Gemini API Key 연동 및 승인</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                시스템 분석 엔진에 본인의 Gemini API Key를 입력하여 직접 승인받고 활용할 수 있습니다. 입력된 API 키는 브라우저 보안 저장소에만 안전하게 보관되며, 언제든지 초기화하여 기본 공용 API 키로 되돌릴 수 있습니다.
              </p>
            </div>
            
            <div className="flex-1 w-full space-y-3">
              <form onSubmit={handleValidateAndSave} className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={inputKey}
                    onChange={(e) => {
                      setInputKey(e.target.value);
                      setValidationStatus('idle');
                      setValidationError('');
                    }}
                    placeholder={geminiApiKey ? "연동된 API 키가 저장되어 있습니다." : "AI-Studio에서 발급받은 Gemini API Key 입력..."}
                    className="w-full pl-3.5 pr-10 py-3 bg-[#070a13] border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-orange-500/50 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                
                <button
                  type="submit"
                  disabled={isValidating || !inputKey.trim()}
                  className="px-5 py-3 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 text-white font-bold rounded-xl text-xs transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isValidating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      승인 검증 중
                    </>
                  ) : (
                    "적용 및 검증"
                  )}
                </button>
                
                {(geminiApiKey || inputKey) && (
                  <button
                    type="button"
                    onClick={handleResetKey}
                    className="px-4 py-3 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    초기화
                  </button>
                )}
              </form>
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-left">
                <div className="flex items-center gap-1.5 font-bold">
                  <span className="text-slate-500">엔진 연결 상태:</span>
                  {geminiApiKey ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <Check className="w-3 h-3" /> 연동 완료 (개인 API 키 사용 중)
                    </span>
                  ) : (
                    <span className="text-slate-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-orange-500 animate-pulse" /> 기본 공용 API 키 가동 중
                    </span>
                  )}
                </div>
                
                {validationStatus === 'success' && (
                  <span className="text-emerald-400 font-bold">✓ API Key 승인 성공!</span>
                )}
                {validationStatus === 'error' && (
                  <span className="text-red-400 font-bold" title={validationError}>
                    ✗ 승인 실패
                  </span>
                )}
              </div>

              <div className="pt-1.5 border-t border-slate-800/40 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] text-slate-400 font-semibold">
                <span>Gemini API Key가 없으신가요?</span>
                <a 
                  href="https://aistudio.google.com/api-keys" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-orange-400 hover:text-orange-300 underline font-extrabold transition-colors inline-flex items-center gap-1 group"
                >
                  Google AI Studio에서 10초 만에 무료 API Key 발급받기
                  <Sparkles className="w-3 h-3 text-orange-400 group-hover:animate-spin" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Strengths Grid Section */}
      <section className="py-16 md:py-20 px-6 max-w-7xl mx-auto" id="strengths-section">
        <div className="text-center space-y-3 mb-12 md:mb-16">
          <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            왜 SCM COMMAND AI 시스템이어야 하는가?
          </h3>
          <p className="text-xs md:text-sm text-slate-400 font-bold max-w-lg mx-auto uppercase tracking-wider">
            기존 ERP 및 수작업 한계를 깨는 4대 핵심 역량과 특장점
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Strength Card 1 */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 hover:border-orange-500/20 hover:bg-[#111a30] transition-all duration-300 shadow-sm group">
            <div className="bg-orange-500/10 text-orange-500 p-3 rounded-xl border border-orange-500/20 w-fit mb-5 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white mb-2 group-hover:text-orange-400 transition-colors">
              5초 실시간 위험 진단
            </h4>
            <p className="text-xs md:text-[13px] text-slate-400 leading-relaxed font-medium">
              복잡한 수작업 자재 소요량 전개(BOM) 프로세스 없이, 지연 부품 명칭만으로 사내 잔여 재고 수명(Run Out)과 공정 중단 골든타임을 실시간 계산합니다.
            </p>
          </div>

          {/* Strength Card 2 */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 hover:border-blue-500/20 hover:bg-[#111a30] transition-all duration-300 shadow-sm group">
            <div className="bg-blue-500/10 text-blue-400 p-3 rounded-xl border border-blue-500/20 w-fit mb-5 group-hover:scale-110 transition-transform">
              <Layers className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
              듀얼 하이브리드 시나리오
            </h4>
            <p className="text-xs md:text-[13px] text-slate-400 leading-relaxed font-medium">
              항공 및 신속 통관을 통한 긴급 대체 조달 방안(시나리오 A)과 사내 공정 라인 변경 및 제품 혼류 배치안(시나리오 B)의 시뮬레이션을 동시 연산해 최선의 합의점을 찾습니다.
            </p>
          </div>

          {/* Strength Card 3 */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 hover:border-emerald-500/20 hover:bg-[#111a30] transition-all duration-300 shadow-sm group">
            <div className="bg-emerald-500/10 text-emerald-400 p-3 rounded-xl border border-emerald-500/20 w-fit mb-5 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">
              즉시 실행 행동 강령 To-Do
            </h4>
            <p className="text-xs md:text-[13px] text-slate-400 leading-relaxed font-medium">
              추상적 조언에 그치지 않고, 자재, 구매, 생산본부 현업 실무진이 24시간 이내에 즉각 가동해야 할 긴급 승인, 서류 준비 사항, 물류 오더 실행 목록을 직접 배포합니다.
            </p>
          </div>

          {/* Strength Card 4 */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 hover:border-purple-500/20 hover:bg-[#111a30] transition-all duration-300 shadow-sm group">
            <div className="bg-purple-500/10 text-purple-400 p-3 rounded-xl border border-purple-500/20 w-fit mb-5 group-hover:scale-110 transition-transform">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">
              1:1 전문가 대화형 컨설팅
            </h4>
            <p className="text-xs md:text-[13px] text-slate-400 leading-relaxed font-medium">
              보고서 출력 완료 즉시 AI SCM 컨설턴트와의 1:1 대화 채널이 개설됩니다. 특송 운임 상한 산정식, 임시 승인 SQ 패스트 트랙 절차 등 고도의 실무 질문에 실시간 답변합니다.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Play / Trial Zone */}
      <section className="py-16 md:py-20 px-6 bg-[#0a0f1d] border-y border-slate-800/60" id="trial-zone">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              제조업 긴급 지연 대응 모의 시뮬레이션
            </h3>
            <p className="text-xs md:text-sm text-slate-400 font-bold max-w-2xl mx-auto leading-relaxed">
              현업에서 무수히 겪는 최악의 3대 공급망 위기 상황입니다. 아래 시나리오 카드를 터치/클릭하시면, 입력 절차 없이 즉시 AI 전문가의 특급 처방 보고서와 의사결정 대시보드를 체험해 보실 수 있습니다.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Scenario card 1 */}
            <div 
              onClick={() => geminiApiKey ? onLaunchPreset(
                "차량용 반도체 (MCU / AP Chip)", 
                "협력사 돌발 설비 고장으로 10일 지연 통보 (사내 재고 2일분 남음, Line Stop 위기)"
              ) : scrollToKeySection()}
              className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 cursor-pointer hover:border-orange-500 hover:bg-slate-800/40 transition-all duration-300 flex flex-col justify-between group shadow-lg hover:shadow-orange-500/5 relative overflow-hidden text-left"
            >
              <div className="absolute top-0 right-0 bg-red-500/10 text-red-400 px-3 py-1 text-[10px] font-bold tracking-wider uppercase border-l border-b border-slate-800 rounded-bl-xl">
                위험도: 심각 (CRITICAL)
              </div>
              <div className="space-y-4">
                <span className="inline-block text-[11px] font-extrabold bg-orange-500/10 text-orange-400 px-2.5 py-0.5 rounded border border-orange-500/25">
                  차량 전장 반도체
                </span>
                <div>
                  <h4 className="text-lg font-bold text-white group-hover:text-orange-400 transition-colors">
                    차량용 반도체 공급 중단 위기
                  </h4>
                  <p className="text-xs text-slate-400 mt-2 font-medium leading-relaxed">
                    핵심 협력사의 생산설비 챔버 오염 고장 발생으로 납기가 10일 무단 지연되었습니다. 현재 사내 안전 재고는 단 2일분뿐입니다.
                  </p>
                </div>
                <div className="bg-[#070a13] p-3 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">지연 일수</span>
                    <span className="text-red-400 font-bold">10일 지연</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">사내 보유량</span>
                    <span className="text-orange-400 font-bold">2일분 잔여 (Line Stop 위협)</span>
                  </div>
                </div>
              </div>
              <div className="pt-6 flex items-center gap-1.5 text-xs text-orange-400 font-bold group-hover:gap-2.5 transition-all mt-4 border-t border-slate-800/50">
                원클릭 시뮬레이션 즉시 개시 <ChevronRight className="w-4 h-4" />
              </div>
            </div>

            {/* Scenario card 2 */}
            <div 
              onClick={() => geminiApiKey ? onLaunchPreset(
                "와이어링 하네스 (Wiring Harness)", 
                "기상 악화 및 해운 물류 대란으로 입고 2주 지연 (사내 재고 5일분 남음)"
              ) : scrollToKeySection()}
              className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 cursor-pointer hover:border-blue-500 hover:bg-slate-800/40 transition-all duration-300 flex flex-col justify-between group shadow-lg hover:shadow-blue-500/5 relative overflow-hidden text-left"
            >
              <div className="absolute top-0 right-0 bg-yellow-500/10 text-yellow-400 px-3 py-1 text-[10px] font-bold tracking-wider uppercase border-l border-b border-slate-800 rounded-bl-xl">
                위험도: 경고 (WARNING)
              </div>
              <div className="space-y-4">
                <span className="inline-block text-[11px] font-extrabold bg-blue-500/10 text-blue-400 px-2.5 py-0.5 rounded border border-blue-500/25">
                  와이어링 배선 하네스
                </span>
                <div>
                  <h4 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                    해상 항로 태풍 및 포트 마비
                  </h4>
                  <p className="text-xs text-slate-400 mt-2 font-medium leading-relaxed">
                    기상 이변 악화와 동아시아 포트 적체 가중으로 입고 스케줄이 2주 순연되었습니다. 사내 재고는 일주일(5일) 분량으로 우회 기획이 필요합니다.
                  </p>
                </div>
                <div className="bg-[#070a13] p-3 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">지연 일수</span>
                    <span className="text-red-400 font-bold">14일 지연</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">사내 보유량</span>
                    <span className="text-blue-400 font-bold">5일분 잔여 (우회 우려)</span>
                  </div>
                </div>
              </div>
              <div className="pt-6 flex items-center gap-1.5 text-xs text-blue-400 font-bold group-hover:gap-2.5 transition-all mt-4 border-t border-slate-800/50">
                원클릭 시뮬레이션 즉시 개시 <ChevronRight className="w-4 h-4" />
              </div>
            </div>

            {/* Scenario card 3 */}
            <div 
              onClick={() => geminiApiKey ? onLaunchPreset(
                "조향 장치 핵심 부품 (EPS Motor / Core)", 
                "협력사 1차 초물 품질 검사(SQ) 탈락으로 재작업 발생, 1주일 지연 (사내 재고 3일분 남음)"
              ) : scrollToKeySection()}
              className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 cursor-pointer hover:border-purple-500 hover:bg-slate-800/40 transition-all duration-300 flex flex-col justify-between group shadow-lg hover:shadow-purple-500/5 relative overflow-hidden text-left"
            >
              <div className="absolute top-0 right-0 bg-purple-500/10 text-purple-400 px-3 py-1 text-[10px] font-bold tracking-wider uppercase border-l border-b border-slate-800 rounded-bl-xl">
                위험도: 주의 (CAUTION)
              </div>
              <div className="space-y-4">
                <span className="inline-block text-[11px] font-extrabold bg-purple-500/10 text-purple-400 px-2.5 py-0.5 rounded border border-purple-500/25">
                  스티어링 휠 기계 가공품
                </span>
                <div>
                  <h4 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors">
                    협력사 품질 심사(SQ) 불합격
                  </h4>
                  <p className="text-xs text-slate-400 mt-2 font-medium leading-relaxed">
                    초물 양산 검사 과정에서 치수 정밀도 불합격 판정으로 현지 전수 재작업 지시가 떨어졌습니다. 1주일 추가 소요되며, 재고는 3일분 남았습니다.
                  </p>
                </div>
                <div className="bg-[#070a13] p-3 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">지연 일수</span>
                    <span className="text-red-400 font-bold">7일 지연</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">사내 보유량</span>
                    <span className="text-purple-400 font-bold">3일분 잔여 (재검 필요)</span>
                  </div>
                </div>
              </div>
              <div className="pt-6 flex items-center gap-1.5 text-xs text-purple-400 font-bold group-hover:gap-2.5 transition-all mt-4 border-t border-slate-800/50">
                원클릭 시뮬레이션 즉시 개시 <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SCM Trust Metrics Banner */}
      <section className="py-16 px-6 max-w-7xl mx-auto border-t border-slate-800/30" id="metrics-section">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 md:gap-12 max-w-4xl mx-auto text-center">
          <div className="space-y-1">
            <div className="text-4xl md:text-5xl font-black text-orange-500 font-mono tracking-tight text-center">92.4%</div>
            <div className="text-sm font-bold text-slate-100">조기 라인스톱 회피율</div>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">대안 조치와 혼류 생산 배합 시 평균 Line Stop 방어 성공률</p>
          </div>
          <div className="space-y-1">
            <div className="text-4xl md:text-5xl font-black text-blue-400 font-mono tracking-tight text-center">5초</div>
            <div className="text-sm font-bold text-slate-100">AI 종합 의사결정 타임</div>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">데이터 분석, 대체 안 기획, 행동 강령 To-Do 도출 전체 소요 시간</p>
          </div>
          <div className="space-y-1">
            <div className="text-4xl md:text-5xl font-black text-purple-400 font-mono tracking-tight text-center">15 Years</div>
            <div className="text-sm font-bold text-slate-100">실무 전문가 지식 탑재</div>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">글로벌 완성차 및 대기업 협력 가치 사슬 위기 대응 비결 내장</p>
          </div>
        </div>
        
        {/* Direct Start Footer CTA */}
        <div className="text-center mt-16 max-w-xl mx-auto p-8 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-4">
          <h4 className="text-lg font-bold text-white">망설일 시간이 없습니다.</h4>
          <p className="text-xs text-slate-400 leading-relaxed font-medium text-center">
            지금 바로 시뮬레이터를 켜고, 지연이 발생한 원자재나 부품명을 입력하여 사상 최고의 SCM 위기 극복 솔루션을 직접 체험해 보세요.
          </p>
          <button 
            onClick={geminiApiKey ? onStartSimulator : scrollToKeySection}
            className="w-full px-6 py-3.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold text-sm transition-all shadow-md cursor-pointer active:scale-95 flex items-center justify-center gap-2"
          >
            {!geminiApiKey ? "API Key 승인 후 시뮬레이터 켜기" : "의사결정 시뮬레이터 지금 켜기"}
            {geminiApiKey ? (
              <ArrowRight className="w-4 h-4" />
            ) : (
              <Key className="w-4 h-4 text-orange-200 animate-pulse" />
            )}
          </button>
        </div>
      </section>
    </div>
  );
}
