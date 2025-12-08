/*
 * 串流媒體解鎖檢測腳本
 * 包含：Netflix, Disney+, YouTube Premium, Spotify, ChatGPT, Claude, Gemini API
 * 更新：支援 Gemini API，需自行填寫
 */

// ===== 配置常量 =====
const CONFIG = {
  UA: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  TIMEOUT: 6000,
  CHROME_VERSION: "131.0.6778"
};

const STATUS = {
  OK: 1,
  COMING: 2,
  FAIL: 0,
  TIMEOUT: -1,
  ERROR: -2
};

const ICONS = {
  SUCCESS: "🟢",
  WARNING: "🟡",
  COLORS: {
    SUCCESS: "#3CB371",
    WARNING: "#DAA520"
  }
};

// ===== 工具函數 =====
class Utils {
  /**
   * 統一的 HTTP 請求封裝
   */
  static request(options) {
    return new Promise((resolve, reject) => {
      const {
        url,
        method = "GET",
        headers = { "User-Agent": CONFIG.UA, "Accept-Language": "en" },
        body = null,
        timeout = CONFIG.TIMEOUT
      } = options;

      const timer = setTimeout(() => reject("Timeout"), timeout);

      const callback = (error, response, data) => {
        clearTimeout(timer);
        if (error) return reject(error);
        resolve({
          status: response.status,
          headers: response.headers || {},
          body: data || ""
        });
      };

      const reqOpts = { url, headers, body };
      method === "POST" 
        ? $httpClient.post(reqOpts, callback)
        : $httpClient.get(reqOpts, callback);
    });
  }

  /**
   * 解析 Surge 參數
   */
  static parseArgs(argString) {
    if (!argString) return {};
    return Object.fromEntries(
      argString.split("&").map(p => {
        const [key, ...valueParts] = p.split("=");
        return [key, valueParts.join("=")];
      })
    );
  }

  /**
   * 構建顯示行
   */
  static buildLine(name, result) {
    let regionStr;
    switch (result.status) {
      case STATUS.OK:
        regionStr = result.region || "OK";
        break;
      case STATUS.COMING:
        regionStr = `${result.region || "N/A"} (Coming)`;
        break;
      case STATUS.FAIL:
        // 優先使用 region 字段，如果為空則顯示 "No"
        regionStr = result.region || "No";
        break;
      case STATUS.TIMEOUT:
        regionStr = "Timeout";
        break;
      case STATUS.ERROR:
        regionStr = result.region || "Error";
        break;
      default:
        regionStr = "N/A";
    }
    return `${name.padEnd(11, " ")} ➟ ${regionStr}`;
  }

  /**
   * 創建標準響應對象
   */
  static createResult(status, region = "") {
    return { status, region };
  }
}

// ===== 服務檢測器 =====
class ServiceChecker {
  /**
   * Netflix 檢測
   */
  static async checkNetflix() {
    const checkFilm = async (id) => {
      try {
        const res = await Utils.request({ 
          url: `https://www.netflix.com/title/${id}` 
        });
        if (res.status === 403) return Utils.createResult(STATUS.FAIL);
        if (res.status === 404) return { ...Utils.createResult(STATUS.ERROR), code: 404 };
        if (res.status === 200) {
          const urlHeader = res.headers["x-originating-url"] || res.headers["X-Originating-URL"] || "";
          const region = urlHeader.split("/")[3]?.split("-")[0]?.toUpperCase() || "US";
          return Utils.createResult(STATUS.OK, region);
        }
      } catch {
        return Utils.createResult(STATUS.ERROR);
      }
      return Utils.createResult(STATUS.FAIL);
    };

    // 先檢測第一個片源，404 則嘗試自製劇
    let result = await checkFilm(80062035);
    if (result.status !== STATUS.OK && result.code === 404) {
      result = await checkFilm(80018499);
    }
    return result.status === STATUS.OK ? result : Utils.createResult(STATUS.FAIL);
  }

  /**
   * Disney+ 檢測
   */
  static async checkDisney() {
    const checkHomePage = async () => {
      try {
        const res = await Utils.request({ url: "https://www.disneyplus.com/" });
        if (res.status !== 200 || res.body.includes('Sorry, Disney+ is not available in your region.')) {
          return { valid: false };
        }
        const match = res.body.match(/Region: ([A-Za-z]{2})[\s\S]*?CNBL: ([12])/);
        return match 
          ? { valid: true, region: match[1], cnbl: match[2] }
          : { valid: true, region: "", cnbl: "" };
      } catch {
        return { valid: false };
      }
    };

    const checkAPI = async () => {
      try {
        const graphqlQuery = {
          query: 'mutation registerDevice($input: RegisterDeviceInput!) { registerDevice(registerDevice: $input) { grant { grantType assertion } } }',
          variables: {
            input: {
              applicationRuntime: 'chrome',
              attributes: {
                browserName: 'chrome',
                browserVersion: CONFIG.CHROME_VERSION,
                manufacturer: 'apple',
                model: null,
                operatingSystem: 'macintosh',
                operatingSystemVersion: '10.15.7',
                osDeviceIds: []
              },
              deviceFamily: 'browser',
              deviceLanguage: 'en',
              deviceProfile: 'macosx'
            }
          }
        };

        const res = await Utils.request({
          url: 'https://disney.api.edge.bamgrid.com/graph/v1/device/graphql',
          method: 'POST',
          headers: {
            "User-Agent": CONFIG.UA,
            "Accept-Language": "en",
            "Authorization": "ZGlzbmV5JmJyb3dzZXImMS4wLjA.Cu56AgSfBTDag5NiRA81oLHkDZfu5L3CKadnefEAY84",
            "Content-Type": "application/json"
          },
          body: JSON.stringify(graphqlQuery)
        });

        if (res.status !== 200) return { valid: false };
        const data = JSON.parse(res.body);
        if (data?.errors) return { valid: false };

        const session = data?.extensions?.sdk?.session;
        return {
          valid: true,
          inSupportedLocation: session?.inSupportedLocation,
          countryCode: session?.location?.countryCode
        };
      } catch {
        return { valid: false };
      }
    };

    try {
      const [homeRes, apiRes] = await Promise.all([checkHomePage(), checkAPI()]);
      const region = apiRes.countryCode || homeRes.region || "";

      if (apiRes.valid) {
        const isSupported = apiRes.inSupportedLocation !== false && apiRes.inSupportedLocation !== 'false';
        return Utils.createResult(isSupported ? STATUS.OK : STATUS.COMING, region);
      }

      return homeRes.valid 
        ? Utils.createResult(STATUS.OK, region)
        : Utils.createResult(STATUS.FAIL);
    } catch {
      return Utils.createResult(STATUS.ERROR);
    }
  }

  /**
   * YouTube Premium 檢測
   */
  static async checkYoutube() {
    try {
      const res = await Utils.request({ url: "https://www.youtube.com/premium" });
      if (res.body.includes("Premium is not available in your country")) {
        return Utils.createResult(STATUS.FAIL);
      }
      const regionMatch = res.body.match(/"countryCode":"(.*?)"/);
      return regionMatch 
        ? Utils.createResult(STATUS.OK, regionMatch[1])
        : Utils.createResult(STATUS.FAIL);
    } catch {
      return Utils.createResult(STATUS.ERROR);
    }
  }

  /**
   * Spotify 檢測
   */
  static async checkSpotify() {
    try {
      const res = await Utils.request({ url: "https://www.spotify.com/premium/" });
      const match = res.body.match(/spotify\.com\/([a-z]{2})\//);
      return match
        ? Utils.createResult(STATUS.OK, match[1].toUpperCase())
        : Utils.createResult(STATUS.FAIL);
    } catch {
      return Utils.createResult(STATUS.FAIL);
    }
  }

  /**
   * ChatGPT 檢測
   */
  static async checkChatGPT() {
    try {
      const res = await Utils.request({ url: "https://chat.openai.com/cdn-cgi/trace" });
      const match = res.body.match(/loc=([A-Z]{2})/);
      return match
        ? Utils.createResult(STATUS.OK, match[1])
        : Utils.createResult(STATUS.FAIL);
    } catch {
      return Utils.createResult(STATUS.FAIL);
    }
  }

  /**
   * Claude 檢測
   */
  static async checkClaude() {
    try {
      const res = await Utils.request({ url: "https://claude.ai/login" });
      // 只要有響應且不包含區域限制資訊即視為可用
      // Cloudflare 403 或重定向 302 都不影響判斷
      return (res.body && !res.body.includes("app-unavailable-in-region"))
        ? Utils.createResult(STATUS.OK, "OK")
        : Utils.createResult(STATUS.FAIL, "No");
    } catch {
      return Utils.createResult(STATUS.FAIL, "No");
    }
  }

  /**
   * Gemini API 檢測
   * 邏輯：只有填寫了有效的 API Key 才顯示在面板上
   * 支援 Surge 模板變數：{{{geminiapikey}}}
   * 
   * 顯示規則：
   * - 可用：OK
   * - 不可用（區域限制）：No
   * - API Key 問題：Invalid API Key
   */
  static async checkGemini() {
    const args = Utils.parseArgs($argument);
    const apiKey = (args.geminiapikey || "").trim();

    // 過濾無效的 API Key：
    // 1. 空字串
    // 2. 模板佔位符（包含 { 或 }）
    // 3. 值為 "0" 或 "null"
    if (!apiKey || 
        apiKey.includes("{") || 
        apiKey.includes("}") || 
        apiKey === "0" || 
        apiKey.toLowerCase() === "null") {
      return null;
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
      const res = await Utils.request({ url });
      const body = (res.body || "").toLowerCase();

      // ✅ API 正常響應 - 顯示 OK
      if (res.status === 200 && body.includes('"models"')) {
        return Utils.createResult(STATUS.OK, "OK");
      }

      // ❌ API Key 無效/過期 - 顯示 Invalid API Key
      if (res.status === 400 && (body.includes("key not valid") || body.includes("api_key_invalid"))) {
        return Utils.createResult(STATUS.ERROR, "Invalid API Key");
      }

      // ❌ 區域限制 - 顯示 No
      if (res.status === 403 || body.includes("region not supported") || body.includes("location is not supported")) {
        return Utils.createResult(STATUS.FAIL, "No");
      }

      // 其他錯誤
      return Utils.createResult(STATUS.ERROR, "Invalid API Key");
    } catch {
      return Utils.createResult(STATUS.ERROR, "Invalid API Key");
    }
  }
}

// ===== 主流程 =====
(async () => {
  try {
    // 並發執行所有檢測
    const [netflix, disney, youtube, spotify, chatgpt, claude, gemini] = await Promise.all([
      ServiceChecker.checkNetflix(),
      ServiceChecker.checkDisney(),
      ServiceChecker.checkYoutube(),
      ServiceChecker.checkSpotify(),
      ServiceChecker.checkChatGPT(),
      ServiceChecker.checkClaude(),
      ServiceChecker.checkGemini()
    ]);

    // 構建服務列表（過濾掉 null）
    const services = [
      { name: "Netflix", result: netflix },
      { name: "Disney+", result: disney },
      { name: "YouTube", result: youtube },
      { name: "Spotify", result: spotify },
      { name: "ChatGPT", result: chatgpt },
      { name: "Claude", result: claude },
      gemini && { name: "Gemini API", result: gemini }
    ].filter(Boolean);

    // 生成顯示內容
    const lines = services.map(s => Utils.buildLine(s.name, s.result));

    // 統計可用服務
    const totalCount = services.length;
    const goodCount = services.filter(s =>
      s.result.status === STATUS.OK || s.result.status === STATUS.COMING
    ).length;

    // 判斷整體狀態
    const hasFailed = services.some(s =>
      s.result.status === STATUS.FAIL ||
      s.result.status === STATUS.ERROR ||
      s.result.status === STATUS.TIMEOUT
    );

    const icon = hasFailed ? ICONS.WARNING : ICONS.SUCCESS;
    const color = hasFailed ? ICONS.COLORS.WARNING : ICONS.COLORS.SUCCESS;

    // 輸出結果
    $done({
      title: `${icon} 可用性檢測 ${goodCount}/${totalCount}`,
      content: lines.join("\n"),
      icon: "play.circle.fill",
      "icon-color": color
    });
  } catch (error) {
    // 全域錯誤處理
    $done({
      title: "❌ 檢測失敗",
      content: `錯誤: ${error.message || error}`,
      icon: "exclamationmark.triangle.fill",
      "icon-color": "#FF6B6B"
    });
  }
})();
