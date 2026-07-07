import { useState, useEffect, useRef, FormEvent } from "react";
import { 
  AlertTriangle, 
  ArrowRight, 
  Bot, 
  CheckCircle2, 
  Clock, 
  Download, 
  FileText, 
  HelpCircle, 
  Info, 
  Loader2, 
  MessageSquare, 
  Play, 
  Printer, 
  RefreshCw, 
  Send, 
  ShieldAlert, 
  TrendingUp, 
  Truck, 
  User,
  Layers,
  ShieldCheck,
  Zap,
  Globe,
  Award,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { marked } from "marked";
import ScmLanding from "./components/ScmLanding";

// Define Interfaces
interface Message {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: string;
}

interface PartExample {
  id: number;
  name: string;
  description: string;
}

interface SituationExample {
  id: number;
  name: string;
  description: string;
}

export default function App() {
  const [showLanding, setShowLanding] = useState<boolean>(true);
  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => {
    return localStorage.getItem("user_gemini_api_key") || "";
  });

  const updateApiKey = (key: string) => {
    setGeminiApiKey(key);
    if (key) {
      localStorage.setItem("user_gemini_api_key", key);
    } else {
      localStorage.removeItem("user_gemini_api_key");
    }
  };

  const handleStartSimulator = () => {
    if (!geminiApiKey) {
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
      return;
    }
    setShowLanding(false);
  };

  // SCM Wizard Steps
  // 1: Selecting Part, 2: Selecting Situation, 3: Completed & Displaying Report
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [selectedPart, setSelectedPart] = useState<string>("");
  const [customPart, setCustomPart] = useState<string>("");
  const [selectedSituation, setSelectedSituation] = useState<string>("");
  const [customSituation, setCustomSituation] = useState<string>("");
  
  // Chat State
  const [chatHistory, setChatHistory] = useState<Message[]>([
    {
      id: "welcome",
      role: "model",
      content: "안녕하세요. SCM 및 수급 최적화 전문가입니다. 현재 지연이 발생하여 문제가 된 부품이 무엇인가요? 아래 제공된 제조 현장의 대표적인 부품 예시 중 하나를 선택하시거나 직접 입력해 주십시오.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // Final Generated Contingency Report
  const [generatedReport, setGeneratedReport] = useState<string>("");

  // To-Do Checklist (Generated from report and editable)
  const [todoList, setTodoList] = useState<{ id: number; text: string; completed: boolean }[]>([
    { id: 1, text: "긴급 대체 파트(Alter Part) 자재 리스트 및 BOM 사양 확보", completed: false },
    { id: 2, text: "대안 공급사 긴급 가동 현황 체크 및 SQ 승인 서류 준비", completed: false },
    { id: 3, text: "긴급 수급을 위한 Hand Carry 물류 특송 포워더 견적 의뢰", completed: false },
    { id: 4, text: "생산 일정 변경에 따른 1, 2차 라인 Changeover 시간 및 작업 조 편성 조정 계획 수립", completed: false }
  ]);

  // Chat window scroll ref
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Constants: 1단계 부품 예시 목록
  const partExamples: PartExample[] = [
    { id: 1, name: "차량용 반도체 (MCU / AP Chip)", description: "엔진 컨트롤 및 전장용 고신뢰성 연산 소자" },
    { id: 2, name: "와이어링 하네스 (Wiring Harness)", description: "차량 전체의 전원 및 통신 신호를 전달하는 조립 배선" },
    { id: 3, name: "조향 장치 핵심 부품 (EPS Motor / Core)", description: "전동식 파워 스티어링 휠 구동 핵심 모터" },
    { id: 4, name: "배터리 셀/모듈 (Battery Cell / Module)", description: "전기차 구동용 리튬이온 고전압 배터리 셀 팩" },
    { id: 5, name: "차체 성형 패널 / 프레스 부품 (Press Panel)", description: "외관 디자인 및 안전 구조를 담당하는 고장력 프레스물" },
    { id: 6, name: "가공 리테이너 / 베어링 류 (Bearing / Retainer)", description: "구동축 마찰을 제어하는 초정밀 기계 가공 요소품" }
  ];

  // Constants: 2단계 상황 및 골든타임 예시 목록
  const situationExamples: SituationExample[] = [
    { id: 1, name: "협력사 돌발 설비 고장으로 10일 지연 통보 (사내 재고 2일분 남음, Line Stop 위기)", description: "공장 중단 직전, 골든타임 48시간 이내 긴급 대응 필수" },
    { id: 2, name: "기상 악화 및 해운 물류 대란으로 입고 2주 지연 (사내 재고 5일분 남음)", description: "대안 포트 우회 및 항공 대체 수급 L/T 산출 필요" },
    { id: 3, name: "협력사 1차 초물 품질 검사(SQ) 탈락으로 재작업 발생, 1주일 지연 (사내 재고 3일분 남음)", description: "SQ 승인 신속 처리 또는 임시 사용 승인 프로세스 검토" },
    { id: 4, name: "파업 및 인력 부족으로 인한 협력사 가동률 저하, 납기 무기한 연기 (재고 소진 임박)", description: "대안 공급처 즉각 다변화 및 안전 재고 쿼터제 가동" },
    { id: 5, name: "원자재 공급 부족으로 인한 협력사 생산 쿼터 축소, 기존 발주량의 50%만 입고 예정", description: "라인 가동 하향 조정 및 고마진 모델 위주 혼류 생산 스케줄링" },
    { id: 6, name: "항공 특송 승인 대기 중으로 인한 3일 단기 지연 (당장 내일 야간 조부터 라인 스톱 우려)", description: "관세 긴급 패스 및 Hand Carry 요원 현장 공항 즉시 배치 필요" }
  ];

  // Scroll to bottom helper
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, chatLoading]);

  // Handle Select Part (Step 1)
  const handleSelectPart = (partName: string) => {
    setSelectedPart(partName);
    
    // Add user answer to chat history
    const userMsg: Message = {
      id: `user-part-${Date.now()}`,
      role: "user",
      content: partName,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatHistory(prev => [...prev, userMsg]);
    setLoading(true);

    // AI responses next question in Step 2
    setTimeout(() => {
      const systemReply: Message = {
        id: `ai-situation-ask-${Date.now()}`,
        role: "model",
        content: `선택하신 지연 부품은 [${partName}] 입니다. 자재 수급 지연에 따른 Line Stop을 방지하기 위해, 현재 공장의 재고 상태와 지연 현황을 수집해야 합니다. 아래의 실시간 상황 예시 중 하나를 선택하시거나 구체적인 현재 재고 상황을 직접 적어 주십시오.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatHistory(prev => [...prev, systemReply]);
      setStep(2);
      setLoading(false);
    }, 800);
  };

  // Handle Custom Part Submit
  const handleCustomPartSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!customPart.trim()) return;
    handleSelectPart(customPart.trim());
  };

  // Handle Select Situation (Step 2)
  const handleSelectSituation = async (situationName: string) => {
    setSelectedSituation(situationName);

    // Add user answer to chat history
    const userMsg: Message = {
      id: `user-sit-${Date.now()}`,
      role: "user",
      content: situationName,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatHistory(prev => [...prev, userMsg]);
    setLoading(true);

    // Call API to analyze and generate report
    try {
      // Temporary status message
      const statusMsg: Message = {
        id: `ai-generating-${Date.now()}`,
        role: "model",
        content: "수집된 정보 [부품: " + (selectedPart || customPart) + ", 상황: " + situationName + "]를 종합하여 분석을 시작합니다. 15년 경력의 SCM 최적화 엔진이 라인 중단 위험도 분석 및 즉시 가동 가능한 2가지 대안 시나리오를 설계하고 있습니다. 잠시만 기다려 주십시오...",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatHistory(prev => [...prev, statusMsg]);

      const reqHeaders: Record<string, string> = { "Content-Type": "application/json" };
      if (geminiApiKey) {
        reqHeaders["x-gemini-api-key"] = geminiApiKey;
      }

      const response = await fetch("/api/gemini/analyze", {
        method: "POST",
        headers: reqHeaders,
        body: JSON.stringify({
          part: selectedPart || customPart,
          situation: situationName
        })
      });

      if (!response.ok) {
        throw new Error("서버 분석 에러가 발생했습니다.");
      }

      const data = await response.json();
      setGeneratedReport(data.report);

      // Successfully generated
      const completeMsg: Message = {
        id: `ai-completed-${Date.now()}`,
        role: "model",
        content: `분석 보고서가 완벽하게 수립되었습니다. 우측 대시보드에서 '비상 대응 시나리오 리포트'를 확인해 보십시오.\n\n시나리오 A(자재 대체 및 긴급 수급)와 시나리오 B(생산 스케줄 및 공정 조정)의 각 리스크 및 L/T, 소요 비용에 대한 평가표를 구성해 두었습니다. 시나리오에 대해 더 궁금하신 사항이 있다면 아래 채팅을 통해 실시간으로 후속 상담을 주십시오.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatHistory(prev => [...prev, completeMsg]);
      setStep(3);

    } catch (error: any) {
      console.error(error);
      const errorMsg: Message = {
        id: `ai-error-${Date.now()}`,
        role: "model",
        content: `분석 과정에서 일시적인 에러가 발생했습니다. AI Studio secrets에서 GEMINI_API_KEY 환경 변수가 정상적으로 등록되어 있는지 확인해 주십시오. (에러: ${error.message})`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatHistory(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  // Handle Custom Situation Submit
  const handleCustomSituationSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!customSituation.trim()) return;
    handleSelectSituation(customSituation.trim());
  };

  // Handle Send Chat (Q&A for Step 3)
  const handleSendChat = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || chatLoading) return;

    const userText = inputMessage;
    setInputMessage("");

    // Add user message
    const userMsg: Message = {
      id: `chat-user-${Date.now()}`,
      role: "user",
      content: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedHistory = [...chatHistory, userMsg];
    setChatHistory(updatedHistory);
    setChatLoading(true);

    try {
      // Map chat messages into server payload history (last 10 messages for context)
      const chatContextHistory = updatedHistory
        .filter(m => m.id !== "welcome" && !m.id.startsWith("ai-generating") && !m.id.startsWith("ai-completed"))
        .slice(-8)
        .map(m => ({
          role: m.role,
          content: m.content
        }));

      const reqHeaders: Record<string, string> = { "Content-Type": "application/json" };
      if (geminiApiKey) {
        reqHeaders["x-gemini-api-key"] = geminiApiKey;
      }

      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: reqHeaders,
        body: JSON.stringify({
          history: chatContextHistory,
          message: userText,
          part: selectedPart || customPart,
          situation: selectedSituation || customSituation,
          report: generatedReport
        })
      });

      if (!response.ok) {
        throw new Error("채팅 서버 응답 에러");
      }

      const data = await response.json();
      
      const aiReply: Message = {
        id: `chat-ai-${Date.now()}`,
        role: "model",
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatHistory(prev => [...prev, aiReply]);
    } catch (err: any) {
      console.error(err);
      const aiReply: Message = {
        id: `chat-ai-error-${Date.now()}`,
        role: "model",
        content: `추가 질문 답변 도중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요: ${err.message}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatHistory(prev => [...prev, aiReply]);
    } finally {
      setChatLoading(false);
    }
  };

  // Reset System to analyze another part
  const handleReset = () => {
    setStep(1);
    setSelectedPart("");
    setCustomPart("");
    setSelectedSituation("");
    setCustomSituation("");
    setGeneratedReport("");
    setChatHistory([
      {
        id: "welcome",
        role: "model",
        content: "안녕하세요. SCM 및 수급 최적화 전문가입니다. 현재 지연이 발생하여 문제가 된 부품이 무엇인가요? 아래 제공된 제조 현장의 대표적인 부품 예시 중 하나를 선택하시거나 직접 입력해 주십시오.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // Launch pre-configured SCM scenario simulation instantly from Landing Page
  const handleLaunchPreset = async (partName: string, situationName: string) => {
    if (!geminiApiKey) {
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
      return;
    }
    setSelectedPart(partName);
    setSelectedSituation(situationName);
    setShowLanding(false);
    setStep(2);
    setLoading(true);
    
    const partMsg: Message = {
      id: `user-part-preset`,
      role: "user",
      content: partName,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    const askMsg: Message = {
      id: `ai-ask-preset`,
      role: "model",
      content: `선택하신 지연 부품은 [${partName}] 입니다. 자재 수급 지연에 따른 Line Stop을 방지하기 위해, 현재 공장의 재고 상태와 지연 현황을 수집해야 합니다. 아래의 실시간 상황 예시 중 하나를 선택하시거나 구체적인 현재 재고 상황을 직접 적어 주십시오.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const sitMsg: Message = {
      id: `user-sit-preset`,
      role: "user",
      content: situationName,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const statusMsg: Message = {
      id: `ai-generating-preset`,
      role: "model",
      content: `수집된 정보 [부품: ${partName}, 상황: ${situationName}]를 종합하여 분석을 시작합니다. 15년 경력의 SCM 최적화 엔진이 라인 중단 위험도 분석 및 즉시 가동 가능한 2가지 대안 시나리오를 설계하고 있습니다. 잠시만 기다려 주십시오...`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatHistory([
      {
        id: "welcome",
        role: "model",
        content: "안녕하세요. SCM 및 수급 최적화 전문가입니다. 현재 지연이 발생하여 문제가 된 부품이 무엇인가요? 아래 제공된 제조 현장의 대표적인 부품 예시 중 하나를 선택하시거나 직접 입력해 주십시오.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
      partMsg,
      askMsg,
      sitMsg,
      statusMsg
    ]);

    try {
      const reqHeaders: Record<string, string> = { "Content-Type": "application/json" };
      if (geminiApiKey) {
        reqHeaders["x-gemini-api-key"] = geminiApiKey;
      }

      const response = await fetch("/api/gemini/analyze", {
        method: "POST",
        headers: reqHeaders,
        body: JSON.stringify({
          part: partName,
          situation: situationName
        })
      });

      if (!response.ok) {
        throw new Error("서버 분석 에러가 발생했습니다.");
      }

      const data = await response.json();
      setGeneratedReport(data.report);

      const completeMsg: Message = {
        id: `ai-completed-preset`,
        role: "model",
        content: `분석 보고서가 완벽하게 수립되었습니다. 우측 대시보드에서 '비상 대응 시나리오 리포트'를 확인해 보십시오.\n\n시나리오 A(자재 대체 및 긴급 수급)와 시나리오 B(생산 스케줄 및 공정 조정)의 각 리스크 및 L/T, 소요 비용에 대한 평가표를 구성해 두었습니다. 시나리오에 대해 더 궁금하신 사항이 있다면 아래 채팅을 통해 실시간으로 후속 상담을 주십시오.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatHistory(prev => [...prev, completeMsg]);
      setStep(3);

    } catch (error: any) {
      console.error(error);
      const errorMsg: Message = {
        id: `ai-error-preset`,
        role: "model",
        content: `분석 과정에서 일시적인 에러가 발생했습니다. AI Studio secrets에서 GEMINI_API_KEY 환경 변수가 정상적으로 등록되어 있는지 확인해 주십시오. (에러: ${error.message})`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatHistory(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  // Convert Markdown Report using 'marked' safely
  const getParsedMarkdown = (md: string) => {
    try {
      return { __html: marked.parse(md) };
    } catch (e) {
      return { __html: md.replace(/\n/g, "<br/>") };
    }
  };

  // Utility to copy report to clipboard
  const handleCopyReport = () => {
    navigator.clipboard.writeText(generatedReport);
    alert("비상 대응 리포트 마크다운 텍스트가 클립보드에 복사되었습니다.");
  };

  // Utility to download report as TXT file
  const handleDownloadReport = () => {
    const element = document.createElement("a");
    const file = new Blob([generatedReport], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `SCM_Contingency_Plan_Report_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Utility to print report
  const handlePrintReport = () => {
    const printContent = document.getElementById("contingency-report-container")?.innerHTML;
    const originalContent = document.body.innerHTML;
    if (printContent) {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>SCM 비상 대응 시나리오 리포트</title>
              <style>
                body { font-family: sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { border: 1px solid #cbd5e1; padding: 12px; text-align: left; }
                th { background-color: #f1f5f9; }
                h1, h2, h3, h4 { color: #0f172a; margin-top: 24px; }
              </style>
            </head>
            <body>
              <h1>[SCM 전문가 시스템] 자재 납기 지연 비상 대응 권장안</h1>
              <hr />
              ${printContent}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  // Toggle checklist item
  const toggleTodo = (id: number) => {
    setTodoList(prev => prev.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
  };

  return (
    <div className="min-h-screen bg-[#070a13] text-slate-100 flex flex-col font-sans selection:bg-orange-500 selection:text-white" id="app-root">
      {/* SCM Enterprise Commander Header */}
      <header className="border-b border-slate-800/80 bg-[#0f172a]/95 backdrop-blur-md sticky top-0 z-50 px-6 py-4 shadow-sm" id="header">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="bg-orange-500/10 text-orange-500 p-2.5 rounded-xl border border-orange-500/20 shadow-inner flex items-center justify-center">
              <Bot className="w-6.5 h-6.5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
                SCM 납기 지연 대응 AI 전문가 시스템
                <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 bg-orange-500/15 text-orange-400 rounded-full border border-orange-500/30">
                  SCM COMMAND v1.2
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">자동차 & 글로벌 가치사슬망 Line Stop 리스크 진단 및 대안 최적화</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-xs">
            <div className="bg-[#1e293b]/60 px-3.5 py-2 rounded-lg border border-slate-700/60 flex items-center gap-2.5 shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse ring-4 ring-emerald-500/20"></span>
              <span className="text-slate-200 font-bold font-mono tracking-wide uppercase">SYSTEM ACTIVE</span>
            </div>
            {showLanding ? (
              <button 
                onClick={handleStartSimulator}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white rounded-lg transition-all duration-200 cursor-pointer font-bold shadow-md active:scale-95"
                id="start-simulator-btn"
              >
                시뮬레이터 바로가기
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowLanding(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#1e293b] hover:bg-[#334155] text-slate-200 hover:text-white rounded-lg border border-slate-700 transition-all duration-200 cursor-pointer font-semibold shadow-sm active:scale-95"
                  id="view-landing-btn"
                >
                  소개 홈 보기
                </button>
                {step > 1 && (
                  <button 
                    onClick={handleReset}
                    className="flex items-center gap-2 px-4 py-2 bg-[#1e293b] hover:bg-[#334155] text-slate-200 hover:text-white rounded-lg border border-slate-700 transition-all duration-200 cursor-pointer font-semibold shadow-sm active:scale-95"
                    id="reset-btn"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    새 분석 시작
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {showLanding ? (
        <ScmLanding 
          onStartSimulator={handleStartSimulator} 
          onLaunchPreset={handleLaunchPreset} 
          geminiApiKey={geminiApiKey}
          onUpdateApiKey={updateApiKey}
        />
      ) : (
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6" id="main-content">
        
        {/* LEFT COLUMN: 순차 대화식 질문 입력 & 가이드 콘솔 (5/12 span) */}
        <div className="lg:col-span-5 flex flex-col bg-[#0f172a] rounded-2xl border border-slate-800 overflow-hidden shadow-xl h-[calc(100vh-140px)] min-h-[620px]" id="chat-column">
          {/* Panel Tab Title */}
          <div className="bg-[#1e293b]/40 px-5 py-4 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <MessageSquare className="w-4.5 h-4.5 text-orange-500" />
              <span className="text-sm font-bold text-slate-100">AI 전문가 가이드 & 상황 제어 콘솔</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold bg-[#070a13] text-orange-400 px-3 py-1 rounded-full border border-slate-800">
              <span>STEP: {step}/3</span>
            </div>
          </div>

          {/* Interactive Chat messages display area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-[#090e1a]/80" id="chat-box">
            <AnimatePresence initial={false}>
              {chatHistory.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {/* AI Expert Avatar */}
                  {msg.role === "model" && (
                    <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center shrink-0 shadow-sm">
                      <Bot className="w-5 h-5" />
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div className={`max-w-[85%] rounded-2xl px-4.5 py-3.5 text-[14px] leading-relaxed ${
                    msg.role === "user" 
                      ? "bg-orange-600 text-white rounded-tr-none shadow-md shadow-orange-900/20 font-medium" 
                      : "bg-[#1e293b]/80 text-slate-100 rounded-tl-none border border-slate-800 shadow-sm"
                  }`}>
                    <div className="whitespace-pre-wrap font-medium">{msg.content}</div>
                    <span className="text-[10px] text-slate-400 block text-right mt-2 font-mono font-medium">
                      {msg.timestamp}
                    </span>
                  </div>

                  {/* User Avatar */}
                  {msg.role === "user" && (
                    <div className="w-9 h-9 rounded-xl bg-orange-600 border border-orange-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <User className="w-5 h-5" />
                    </div>
                  )}
                </motion.div>
              ))}

              {/* Chat loading loader */}
              {chatLoading && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3.5 justify-start"
                >
                  <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
                    <Bot className="w-5 h-5 animate-spin" />
                  </div>
                  <div className="bg-[#1e293b]/80 text-slate-300 rounded-2xl rounded-tl-none border border-slate-800 px-4.5 py-3.5 text-sm flex items-center gap-2.5 shadow-sm">
                    <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                    현장 대응 시나리오 분석 검토 중...
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={chatEndRef} />
          </div>

          {/* Interactive Input Form Control Area */}
          <div className="p-5 bg-[#111827] border-t border-slate-800/90 shadow-2xl" id="controls-area">
            {/* 1단계: 지연 부품 선택 카드 컨트롤 */}
            {step === 1 && !loading && (
              <div className="space-y-4" id="step1-controls">
                <div className="flex items-center gap-2 text-xs text-orange-400 font-bold uppercase tracking-wider mb-1">
                  <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                  지연 발생 대상 대표 부품군 선택
                </div>
                <div className="grid grid-cols-1 gap-2.5 max-h-[240px] overflow-y-auto pr-1">
                  {partExamples.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelectPart(item.name)}
                      className="w-full text-left px-4 py-3 bg-[#0a0f1d] hover:bg-slate-800/40 text-slate-200 hover:text-white rounded-xl border border-slate-800 hover:border-slate-700 transition-all duration-200 flex items-center gap-4 cursor-pointer text-xs group"
                    >
                      <span className="bg-slate-800 text-orange-400 font-mono w-6.5 h-6.5 rounded-lg flex items-center justify-center shrink-0 font-bold border border-slate-700/80 group-hover:bg-orange-500 group-hover:text-white group-hover:border-orange-400 transition-colors">
                        {item.id}
                      </span>
                      <div className="flex-1">
                        <div className="font-bold text-slate-100 group-hover:text-white transition-colors text-[13px]">{item.name}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5 group-hover:text-slate-300 transition-colors leading-relaxed">{item.description}</div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-orange-400 transition-colors shrink-0" />
                    </button>
                  ))}
                </div>

                <div className="border-t border-slate-800/80 my-2 pt-3">
                  <form onSubmit={handleCustomPartSubmit} className="flex gap-2.5">
                    <input
                      type="text"
                      value={customPart}
                      onChange={(e) => setCustomPart(e.target.value)}
                      placeholder="7. 주관식 입력 (위 부품 리스트 외의 부품명을 직접 입력)"
                      className="flex-1 bg-[#070a13] text-slate-100 text-xs rounded-xl border border-slate-800 px-4 py-3.5 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-[13px] placeholder:text-slate-500"
                      id="custom-part-input"
                    />
                    <button
                      type="submit"
                      disabled={!customPart.trim()}
                      className="bg-orange-600 hover:bg-orange-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-xs px-5 rounded-xl transition-all duration-200 flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95 shadow-md"
                    >
                      확인 <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* 2단계: 현재 상황 선택 카드 컨트롤 */}
            {step === 2 && !loading && (
              <div className="space-y-4" id="step2-controls">
                <div className="flex items-center gap-2 text-xs text-blue-400 font-bold uppercase tracking-wider mb-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                  실시간 입고/재고 위험도 상황 선택
                </div>
                <div className="grid grid-cols-1 gap-2.5 max-h-[250px] overflow-y-auto pr-1">
                  {situationExamples.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelectSituation(item.name)}
                      className="w-full text-left px-4 py-3 bg-[#0a0f1d] hover:bg-slate-800/40 text-slate-200 hover:text-white rounded-xl border border-slate-800 hover:border-slate-700 transition-all duration-200 flex items-center gap-4 cursor-pointer text-xs group"
                    >
                      <span className="bg-slate-800 text-blue-400 font-mono w-6.5 h-6.5 rounded-lg flex items-center justify-center shrink-0 font-bold border border-slate-700/80 group-hover:bg-blue-500 group-hover:text-white group-hover:border-blue-400 transition-colors">
                        {item.id}
                      </span>
                      <div className="flex-1">
                        <div className="font-bold text-slate-100 group-hover:text-white transition-colors text-[13px] leading-snug line-clamp-2">{item.name}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5 group-hover:text-slate-300 transition-colors leading-relaxed">{item.description}</div>
                      </div>
                      <Play className="w-3 h-3 text-slate-600 group-hover:text-blue-400 transition-colors shrink-0 fill-current" />
                    </button>
                  ))}
                </div>

                <div className="border-t border-slate-800/80 my-2 pt-3">
                  <form onSubmit={handleCustomSituationSubmit} className="flex gap-2.5">
                    <input
                      type="text"
                      value={customSituation}
                      onChange={(e) => setCustomSituation(e.target.value)}
                      placeholder="7. 주관식 입력 (현재 공장의 구체적인 지연 일수 및 사내 잔여 재고량 입력)"
                      className="flex-1 bg-[#070a13] text-slate-100 text-xs rounded-xl border border-slate-800 px-4 py-3.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-[13px] placeholder:text-slate-500"
                      id="custom-situation-input"
                    />
                    <button
                      type="submit"
                      disabled={!customSituation.trim()}
                      className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-xs px-5 rounded-xl transition-all duration-200 flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95 shadow-md"
                    >
                      분석 시작 <Play className="w-3.5 h-3.5 fill-white" />
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* 3단계: 분석 완료 후 후속 상담 챗창 */}
            {step === 3 && (
              <div className="space-y-4" id="step3-controls">
                <div className="flex items-center justify-between text-xs text-slate-400 font-bold mb-1">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                    1:1 SCM 전문가 추가 컨설팅 Q&A
                  </span>
                  <span className="text-[10px] text-orange-400 font-mono font-bold bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">실시간 상담 최적화 상태</span>
                </div>
                <form onSubmit={handleSendChat} className="flex gap-2.5">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="조치 방안 L/T 단축법, 추가 특송 비용 한도 산출 등 질문을 입력하세요."
                    className="flex-1 bg-[#070a13] text-slate-100 text-xs rounded-xl border border-slate-800 px-4 py-3.5 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-[13px] placeholder:text-slate-500"
                    id="chat-input"
                  />
                  <button
                    type="submit"
                    disabled={!inputMessage.trim() || chatLoading}
                    className="bg-orange-600 hover:bg-orange-500 disabled:bg-slate-800 disabled:text-slate-500 text-white p-3 rounded-xl transition-all duration-200 shrink-0 cursor-pointer flex items-center justify-center active:scale-95 shadow-md"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

            {/* Loading Cover Spinner when generating */}
            {loading && (
              <div className="py-8 flex flex-col items-center justify-center space-y-4 text-center" id="processing-loader">
                <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
                <div>
                  <p className="text-sm font-bold text-slate-100">공급망 리스크 시뮬레이션 및 최적 가동 연산 중...</p>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">15년 경력 생산계획 지식베이스 기반 대안 시나리오 최적 설계</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: AI 비상 대응 보고서 관제 패널 (7/12 span) */}
        <div className="lg:col-span-7 flex flex-col bg-[#0f172a] rounded-2xl border border-slate-800 overflow-hidden shadow-xl h-[calc(100vh-140px)] min-h-[620px]" id="dashboard-column">
          {/* Header Dashboard Controls */}
          <div className="bg-[#1e293b]/40 px-5 py-4 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <FileText className="w-4.5 h-4.5 text-orange-500" />
              <span className="text-sm font-bold text-slate-100">최적 비상 가동 대시보드 (SCM Command)</span>
            </div>
            
            {step === 3 && (
              <div className="flex items-center gap-2" id="toolbar">
                <button 
                  onClick={handleCopyReport}
                  className="p-2 bg-[#070a13] hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-800 transition-colors cursor-pointer shadow-sm"
                  title="클립보드에 전체 복사"
                >
                  <FileText className="w-4 h-4" />
                </button>
                <button 
                  onClick={handleDownloadReport}
                  className="p-2 bg-[#070a13] hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-800 transition-colors cursor-pointer shadow-sm"
                  title="텍스트 파일로 다운로드"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button 
                  onClick={handlePrintReport}
                  className="p-2 bg-[#070a13] hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-800 transition-colors cursor-pointer shadow-sm"
                  title="인쇄 전용 모드 열기"
                >
                  <Printer className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Interactive display area depending on state */}
          <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6 bg-[#090e1a]/50" id="report-view">
            {step < 3 ? (
              /* PRE-ANALYZE WELCOME SCREEN */
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-7" id="welcome-dashboard">
                <div className="relative">
                  <div className="absolute -inset-2 bg-orange-500/10 rounded-full blur-xl animate-pulse"></div>
                  <div className="relative bg-[#1e293b] border border-slate-700/80 p-6 rounded-full text-slate-400 shrink-0">
                    <ShieldAlert className="w-14 h-14 text-orange-500" />
                  </div>
                </div>

                <div className="max-w-md space-y-3">
                  <h3 className="text-xl font-extrabold text-white tracking-tight">납기 지연 비상 대응 시스템 관제 준비 완료</h3>
                  <p className="text-[13px] text-slate-400 leading-relaxed font-medium">
                    공급망 및 자재 수급 지연 발생 시, 사내 생산 스케줄을 실시간으로 추적하여 라인 중단 위험을 진단하고,
                    <span className="text-orange-400 font-bold mx-1">자재 대체 수급 시나리오</span>와 
                    <span className="text-blue-400 font-bold mx-1">공정 조정 혼류 생산 계획</span>을 설계하여 가동률을 수호합니다.
                  </p>
                </div>

                {/* SCM Roadmap Pipeline visualizer */}
                <div className="w-full max-w-sm bg-[#111827] p-5 rounded-2xl border border-slate-800 space-y-4 shadow-md" id="pipeline-chart">
                  <div className="text-[11px] text-slate-400 uppercase font-bold tracking-wider text-left border-b border-slate-800 pb-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                    대응 시나리오 분석 파이프라인
                  </div>
                  <div className="space-y-3.5 text-xs text-left">
                    <div className="flex items-center gap-3.5">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                        step === 1 ? "bg-orange-500 text-slate-950 ring-4 ring-orange-500/20" : "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                      }`}>1</div>
                      <span className={step === 1 ? "text-slate-100 font-bold" : "text-slate-500 font-medium"}>
                        지연 부품 수급 위험도 판단 (BOM & 공정 매핑)
                      </span>
                    </div>
                    <div className="w-0.5 h-3 bg-slate-800 ml-3"></div>
                    <div className="flex items-center gap-3.5">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                        step === 2 ? "bg-blue-500 text-slate-950 ring-4 ring-blue-500/20" : "bg-slate-800 text-slate-500"
                      }`}>2</div>
                      <span className={step === 2 ? "text-slate-100 font-bold" : "text-slate-500 font-medium"}>
                        현재 공장 가동 상태 및 최적 골든타임 계측
                      </span>
                    </div>
                    <div className="w-0.5 h-3 bg-slate-800 ml-3"></div>
                    <div className="flex items-center gap-3.5">
                      <div className="w-6 h-6 rounded-lg bg-slate-800 text-slate-500 flex items-center justify-center text-xs font-bold border border-slate-700/30">3</div>
                      <span className="text-slate-500 font-medium">
                        가동률 수호 비상 시나리오 및 SCM 보고서 출력
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium bg-[#111827] px-4 py-2 rounded-full border border-slate-800/80">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span>실시간 모의 시뮬레이션 산출 소요 시간 약 3~5초</span>
                </div>
              </div>
            ) : (
              /* REPORT OUTPUT STAGE (Step 3) */
              <div className="space-y-6" id="report-active">
                {/* Real-time Contingency Status Alert Badge styled with Bento elements */}
                <div className="bg-gradient-to-r from-orange-500/15 to-red-500/15 border border-orange-500/25 p-5 rounded-2xl flex items-start gap-4 shadow-sm">
                  <div className="bg-orange-500/10 text-orange-400 p-2.5 rounded-xl border border-orange-500/20 shrink-0">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                      비상 경보: 비상 자재 수급 대응 태세 가동 (Contingency Plan Triggered)
                    </h4>
                    <p className="text-xs text-slate-300 mt-1.5 leading-relaxed font-medium">
                      지연 발생 부품 <span className="text-orange-400 font-extrabold font-mono bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20">[{selectedPart || customPart}]</span>에 대해 시뮬레이션된 최적 비상 가동 결과입니다. 아래 전문가 행동 강령을 즉각 조치하십시오.
                    </p>
                  </div>
                </div>

                {/* SCM Contingency AI Report Container rendered from markdown in Bento dark card */}
                <div 
                  className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 md:p-8 text-[14px] text-slate-200 leading-relaxed shadow-lg font-sans space-y-5 prose prose-invert max-w-none"
                  id="contingency-report-container"
                >
                  <div 
                    className="report-markdown-body"
                    dangerouslySetInnerHTML={getParsedMarkdown(generatedReport)}
                  />
                </div>

                {/* Interactive Immediate Action checklist widgets */}
                <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 space-y-4" id="action-checklist">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-orange-500" />
                      <h4 className="text-[13px] font-extrabold text-white uppercase tracking-wider">
                        현장 관리 본부 24시간 이내 비상 실행 체크리스트 (To-Do)
                      </h4>
                    </div>
                    <span className="text-[10px] text-orange-400 font-bold bg-orange-500/10 px-2.5 py-0.5 rounded-full border border-orange-500/20">
                      가동 정지 보호 조치
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed font-medium">
                    대응 계획 가동 즉시 관련 유관 부서들과 아래의 핵심 실행 과제를 공조 검토하고 체크하십시오.
                  </p>

                  <div className="grid grid-cols-1 gap-2.5 pt-2">
                    {todoList.map((item) => (
                      <label 
                        key={item.id}
                        className={`flex items-start gap-3.5 p-3.5 rounded-xl border cursor-pointer select-none transition-all duration-200 ${
                          item.completed 
                            ? "bg-orange-500/5 border-orange-500/20 text-slate-500" 
                            : "bg-[#070a13] border-slate-800 hover:border-slate-700 text-slate-200"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() => toggleTodo(item.id)}
                          className="mt-0.5 accent-orange-500 cursor-pointer rounded w-4 h-4 text-orange-600 bg-slate-950 border-slate-800 focus:ring-0"
                        />
                        <span className={`text-[13px] font-medium leading-relaxed ${item.completed ? "line-through text-slate-500" : ""}`}>
                          {item.text}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* SCM KPI Stat Mock summary widgets */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" id="kpi-metrics">
                  <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4.5 space-y-2.5 shadow-sm">
                    <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                      라인정지 리스크 저감율
                    </div>
                    <div className="text-2xl font-mono font-black text-orange-500 tracking-tight">92.4%</div>
                    <div className="text-xs text-slate-400 leading-normal font-medium">대체 조치 병행 시 예상 정지 회피율</div>
                  </div>
                  <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4.5 space-y-2.5 shadow-sm">
                    <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                      긴급 조달 소요 시간
                    </div>
                    <div className="text-2xl font-mono font-black text-blue-400 tracking-tight">36 ~ 48 Hr</div>
                    <div className="text-xs text-slate-400 leading-normal font-medium">대안 수급 포트 대체 시 통관 단축 평균 L/T</div>
                  </div>
                  <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4.5 space-y-2.5 shadow-sm">
                    <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                      사내 가동 기간 보호
                    </div>
                    <div className="text-2xl font-mono font-black text-purple-400 tracking-tight">+5 Days</div>
                    <div className="text-xs text-slate-400 leading-normal font-medium">공정 재구성 및 혼류 세팅 시 확보 가능한 일수</div>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>

      </main>
      )}

      {/* Styled SCM Footer */}
      <footer className="bg-[#070a13] border-t border-slate-800 px-6 py-4.5 text-center text-xs text-slate-500 shadow-inner" id="footer">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 font-mono font-medium">
          <span>© 2026 SCM 납기 지연 대응 지원 AI 전문가 시스템 • 통합 엔터프라이즈 모듈 v1.2</span>
          <span className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-orange-500" />
            <span className="text-slate-400 font-bold">공급망 모니터링 파이프라인 실시간 가동 중</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
