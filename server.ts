import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// Initialize Gemini SDK helper function
function getGoogleGenAI(reqCustomApiKey?: string): GoogleGenAI {
  const apiKey = reqCustomApiKey?.trim() || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY가 존재하지 않습니다.");
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// 1. API Endpoint for generating the Contingency Plan Report
app.post("/api/gemini/analyze", async (req, res) => {
  const customKey = (req.headers["x-gemini-api-key"] as string | undefined)?.trim();
  
  let currentAi: GoogleGenAI;
  try {
    currentAi = getGoogleGenAI(customKey);
  } catch (error) {
    return res.status(400).json({
      error: "AI 서비스가 구성되지 않았습니다. 랜딩페이지에서 개인 Gemini API Key를 입력하시거나, AI Studio Secrets 패널에서 GEMINI_API_KEY를 설정해 주세요."
    });
  }

  const { part, situation } = req.body;

  if (!part || !situation) {
    return res.status(400).json({ error: "지연 부품명과 현재 상황 데이터가 누락되었습니다." });
  }

  const systemInstruction = `너는 자동차 및 글로벌 제조업 공급망 관리(SCM) 및 생산 관리 분야에서 15년 이상의 경력을 가진 "생산 스케줄링 및 자재 수급 최적화 전문가"다.
공장장 및 현장 관리자가 즉각적으로 실질적이고 전략적인 의사결정을 내릴 수 있도록, 실시간 상황 정보를 분석하여 구체적이고 정량적인 비상 대응 시나리오(Contingency Plan)를 도출해야 한다.

[행동 지침]
1. 주관적이고 모호한 표현("잘", "적절히", "적당한", "안전한", "가능한 한 빨리" 등)은 절대 금지한다.
2. 구체적인 수치와 명확한 행동 동사를 사용하라 (예: '골든타임 48시간', 'L/T 36시간', 'Changeover 시간 2시간 단축', '안전 재고 3일분 추가 확보' 등).
3. 자동차 및 제조 현장 실무자가 직관적으로 이해할 수 있는 전문 도메인 용어를 정확하게 사용하라 (예: 'Line Stop', 'Alter Part', 'Changeover', 'SQ 승인', 'Hand Carry', 'JIT (Just-In-Time)', 'CKD', 'OEM', 'Buffer Stock', 'Safety Stock' 등).
4. 보고서 본문 전체에 생략을 뜻하는 문장 부호("...", "이하 생략")를 절대 사용하지 말고, 모든 문장을 결론과 근거까지 완전하게 작성하라.
5. 시나리오 A와 시나리오 B는 서로 뚜렷이 대비되는 현실적 대안이어야 한다.
  - 시나리오 A: 대체 부품(Alter Part) 식별 및 Hand Carry/퀵 패스 등 항공/특송 등을 활용한 자재 긴급 조달안
  - 시나리오 B: 혼류 생산 조정, 생산 우선순위 변경, 가동 정지 예방을 위한 가동 시간 및 공정 자체 조정안

반드시 아래 제공되는 [Output Format]의 마크다운 형식을 한 자도 틀리지 말고 그대로 출력하라. 다른 환영 인사나 도입부, 결론부 사족 없이 바로 '# 1. 지연 상황 및 영향도 분석'으로 시작하는 마크다운 텍스트만 리턴해야 한다.

[Output Format]
### 1. 지연 상황 및 영향도 분석
- **지연 부품**: [부품명 및 이 부품의 핵심 물리적/전기적 기능과 장착 부위 상세 서술]
- **골든타임**: [정량적으로 계산된 생산 라인 중단 유예 기간, 예: '사내 재고 X일분 기준으로 산출된 골든타임 XX시간']
- **예상 리스크**: [라인 중단 시 발생 가능한 구체적인 리스크 범위, 일일 손실 비용 및 생산 차질 대수 등 정량적 영향 범위 명기]

### 2. 비상 대응 시나리오 제안
#### [시나리오 A: 자재 대체 및 긴급 수급]
- **세부 실행 방안**: [어떻게 대체 파트(Alter Part)를 확보하고 Hand Carry 혹은 특송으로 조달하는지 구체적 액션 서술]
- **대안 공급처/조달 경로**: [대체 가능한 신규 협력사 후보 또는 글로벌 다른 거점의 물량 전환 경로]
- **예상 리드타임(L/T)**: [조달 시작부터 현장 공장 입고 및 검수 완료까지의 소요 리드타임(L/T) 정량적 표기]

#### [시나리오 B: 생산 스케줄 및 공정 조정]
- **세부 실행 방안**: [지연 부품이 들어가지 않는 다른 차종/제품의 생산 스케줄 선반영, Changeover 설정 조정을 통한 우선순위 변경 방안 서술]
- **조정 대상 공정/라인**: [스케줄 조정이 가해질 구체적 제조 공정 라인 명칭 기입]
- **단기 일정 변경 계획**: [향후 3일~1주일간의 일자별/조별 구체적 가동 및 교대 배치 스케줄 조정안]

### 3. 시나리오 비교 및 최종 권장안
| 평가 항목 | 시나리오 A (자재 대체 안) | 시나리오 B (공정 조정 안) |
| :--- | :--- | :--- |
| **라인 중단 방지 효과** | [상/중/하] (정량적 유예 일수 기재) | [상/중/하] (정량적 가동률 기재) |
| **소요 비용 및 공수** | [상/중/하] (추가 물류/단가 프리미엄 및 세금) | [상/중/하] (설비 교체, Changeover 셋팅 공수 및 공정 지연 패널티) |
| **품질/공정 리스크** | [대체 부품 승인(SQ 승인) 및 품질 신뢰성 리스크 상세 작성] | [계획 변경에 따른 혼류 생산 복잡도 증가 및 미완성 재고 적재 리스크 작성] |

- **최종 권장 안 및 행동 지침**: [현시점에서 공장 가동률과 손실 비용을 저울질하여 가장 추천하는 시나리오와 24시간 이내에 즉시 착수해야 할 구체적인 조치 사항 3가지를 명확한 명령문 형태의 행동 동사로 기술]`;

  try {
    const prompt = `사용자가 입력한 정보는 다음과 같습니다:
- 지연 부품: ${part}
- 현재 상황 및 재고 현황: ${situation}

위 데이터를 바탕으로 최고의 시나리오 대책 보고서를 작성해 주십시오.`;

    const response = await currentAi.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.2, // 전문가 시스템이므로 일관되고 고도로 정형화된 정량 수치 출력을 위해 온도를 낮춤
      },
    });

    res.json({ report: response.text });
  } catch (error: any) {
    console.error("Gemini analyze error:", error);
    res.status(500).json({ error: "AI 분석에 실패했습니다: " + error.message });
  }
});

// 1.5. API Endpoint to validate a custom Gemini API Key
app.post("/api/gemini/validate", async (req, res) => {
  const customKey = req.body.apiKey?.trim();
  if (!customKey) {
    return res.status(400).json({ error: "API Key가 전달되지 않았습니다." });
  }

  const testAi = new GoogleGenAI({
    apiKey: customKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });

  // Try different models to accommodate different types of keys (free, billing, preview limits)
  const modelsToTry = [
    "gemini-2.5-flash",
    "gemini-3.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash"
  ];

  let lastError: any = null;

  for (const modelName of modelsToTry) {
    try {
      const response = await testAi.models.generateContent({
        model: modelName,
        contents: "Hello. Respond with 'OK'.",
      });
      if (response && response.text) {
        return res.json({ valid: true, modelUsed: modelName });
      }
    } catch (err: any) {
      console.warn(`Validation failed for model ${modelName}:`, err?.message || err);
      lastError = err;
    }
  }

  console.error("Gemini validation final error:", lastError);
  return res.status(400).json({ 
    valid: false, 
    error: lastError?.message || "유효하지 않은 API 키이거나 해당 모델 권한이 없습니다." 
  });
});

// 2. Chat Q&A API Endpoint for follow-up questions
app.post("/api/gemini/chat", async (req, res) => {
  const customKey = req.headers["x-gemini-api-key"] as string | undefined;
  
  let currentAi: GoogleGenAI;
  try {
    currentAi = getGoogleGenAI(customKey);
  } catch (error) {
    return res.status(400).json({
      error: "AI 서비스가 구성되지 않았습니다. 랜딩페이지에서 개인 Gemini API Key를 입력하시거나, AI Studio Secrets 패널에서 GEMINI_API_KEY를 설정해 주세요."
    });
  }

  const { history, message, part, situation, report } = req.body;

  if (!message) {
    return res.status(400).json({ error: "질문 메시지가 누락되었습니다." });
  }

  const systemInstruction = `너는 SCM 및 생산 관리 분야에서 15년 이상의 경력을 가진 "생산 스케줄링 및 자재 수급 최적화 전문가"다.
현재 사용자는 다음과 같은 부품 지연 문제에 직면해 있으며, 이미 비상 대응 시나리오 보고서를 전달받은 상태다:
- 지연 부품: ${part}
- 지연 상황: ${situation}
- 분석 보고서: ${report || "미정"}

사용자가 이 보고서 또는 지연 대응에 대해 추가 질문이나 상세 액션 플랜을 문의하고 있다.
너는 극도로 전문적인 톤앤매너로 답변해야 하며, 다음 규칙을 절대적으로 준수하라:
1. 주관적이거나 모호한 답변을 피하고 항상 구체적인 정량적 수치와 자동차 공장/제조 공정 실무 중심의 가이드를 제공하라.
2. 'Line Stop', 'Alter Part', 'Changeover', 'SQ 승인', 'Hand Carry' 등 실무 용어를 자유롭게 녹여내어 신뢰성을 확보하라.
3. 질문에 명확하고 간결하게 답하되, 24시간 이내 현장에서 당장 착수할 수 있는 현실적인 지침을 최소한 한 가지씩 곁들여라.
4. 생략 기호(...)는 절대 쓰지 말고, 정중하면서도 군더더기 없는 전문가의 어조를 고수하라.`;

  try {
    const formattedContents: any[] = [];
    
    // Convert client-provided history to Gemini SDK format if available
    if (history && Array.isArray(history)) {
      history.forEach((chatItem: any) => {
        formattedContents.push({
          role: chatItem.role === "user" ? "user" : "model",
          parts: [{ text: chatItem.content }],
        });
      });
    }

    // Append current user message
    formattedContents.push({
      role: "user",
      parts: [{ text: message }],
    });

    const response = await currentAi.models.generateContent({
      model: "gemini-3.5-flash",
      contents: formattedContents,
      config: {
        systemInstruction,
        temperature: 0.3,
      },
    });

    res.json({ reply: response.text });
  } catch (error: any) {
    console.error("Gemini chat error:", error);
    res.status(500).json({ error: "AI 답변에 실패했습니다: " + error.message });
  }
});

// Serve static assets and handle SPA routing
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SCM Expert AI System Server running on http://localhost:${PORT}`);
  });
}

startServer();
