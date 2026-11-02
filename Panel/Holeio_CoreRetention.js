/*
 * ============================================================================
 *  Hole.io 測試改寫腳本（Surge iOS，單檔同時處理「請求端」與「回應端」）
 * ============================================================================
 *  同一支腳本掛兩次：http-request 改 level、http-response 改 body，
 *  靠「是否有 $response」自動分辨。
 *
 *  ★ 幾乎所有可調項目都能在 Surge「模組 → 編輯參數」直接修改，不必動這支 .js：
 *
 *    [等級/金幣/時間]
 *      ReportedLevel        回報給伺服器的等級(預設 5；不改實際遊戲進度)
 *      LevelCompleteCoins   每關完成金幣(預設 3000；原 200)
 *      GameDurationMinutes  每關時間/分鐘(預設 15；原 2)
 *    [玩法/計分]
 *      FallingObjectScore   掉落物(城牆類)得分(預設 5)
 *      Gravity              重力(預設 -80；絕對值越大掉越快)
 *      SuctionMultiplier    吸力倍率(預設 1.2；越大吸越強)
 *      BlackHoleChaseMode   黑洞追逐模式 0/1(預設 0)
 *      BlackHoleFrenzyMode  黑洞狂暴模式 0/1(預設 0)
 *      RewardMultiplier     關卡獎勵倍率(預設 1；調大=金幣等獎勵等比放大)
 *    [造型]
 *      SkinsFreeNoAds       免廣告免費解鎖造型 0/1(預設 1)
 *    [留存系統開關 0/1]
 *      EnergyActive 體力、LivesActive 生命、DailyRewardsActive 每日獎勵、
 *      DailyMissionsActive 每日任務、DailyCalendarActive 每日月曆 (預設全 0)
 *    [商店/經濟金額]
 *      AdOrPayCoins 去廣告/付費替代獎勵(1500)、CrazyPackCoins(4000)、
 *      PremiumOfferCoins(1500)、BuyLivesCost 買生命價(900)、BuyEnergyCost 買體力價(900)
 *
 *  複雜的陣列類(洞成長曲線、機器人分布…)不適合塞進手機參數欄位，留在下方 CONFIG 編輯。
 *  僅供自己裝置測試；只改你手機收到的設定，不會上傳。
 * ============================================================================
 */

const ENABLED = true;   // 總開關：false = 完全不改寫

/* ---- 讀取 Surge 模組參數（$argument）；未帶或留空時回落各自預設 ---- */
function parseArg(s) {
  var o = {};
  (s || "").split("&").forEach(function (kv) {
    if (!kv) return;
    var i = kv.indexOf("=");
    var k = i < 0 ? kv : kv.slice(0, i);
    var v = i < 0 ? "" : kv.slice(i + 1);
    try { o[decodeURIComponent(k)] = decodeURIComponent(v); }
    catch (e) { o[k] = v; }
  });
  return o;
}
var ARG = parseArg(typeof $argument !== "undefined" ? $argument : "");
function _blank(name, v) {
  return v === undefined || v === null || v === "" || v === "{{{" + name + "}}}";
}
function argNum(name, dflt) {
  var v = ARG[name];
  if (_blank(name, v)) return dflt;
  var n = Number(v);
  return isNaN(n) ? dflt : n;
}
function argBool(name, dflt) {
  var v = ARG[name];
  if (_blank(name, v)) return dflt;
  return v === "1" || v === "true" || v === "yes";
}

var SKINS_FREE = argBool("SkinsFreeNoAds", true);  // 免廣告免費造型(預設開)

/* ======================= CONFIG 可編輯區 ======================= */
/* 標「=arg...」的欄位由 Surge 模組參數控制，平常改模組參數即可。 */
const CONFIG = {

  /* ───────────────────────── 1. 核心玩法 ───────────────────────── */

  // 洞的成長門檻(陣列，留在 JS 編輯)：索引=尺寸等級，值=升級所需累積點數，越小越快，-1=封頂。
  HoleGrowthConfig: {
    _enabled: true,
    Active: true,
    Normal:   [0,10,20,40,50,55,60,65,70,75,80,85,90,100,110,120,150,200,220,240,-1,-1],
    Hard:     [0,10,20,40,50,55,60,65,70,75,80,85,90,100,110,120,150,200,220,240,-1,-1],
    VeryHard: [0,10,20,40,50,55,60,65,70,75,80,85,90,100,110,120,150,200,220,240,-1,-1],
  },

  // 吸入手感。HeightSuctionMultiplier 由模組參數 SuctionMultiplier 控制。
  HoleSuctionConfig: {
    _enabled: true,
    Enabled: true,
    AffectBots: false,
    HeightBounds: 12,
    SwallowFriction: 0.3,
    UseAccelerationRamp: true,
    TiltCorrectionStrength: 33,
    HeightSuctionMultiplier: argNum("SuctionMultiplier", 1.2),   // =arg SuctionMultiplier
    AccelerationRampDuration: 0.3,
    AccelerationRampStrength: 120,
    StackFOLinearDragOverride: 4,
    MinHeightForTiltCorrection: 25,
    StackFOAngularDragOverride: 0.05,
    ReduceFrictionWhileSwallowing: true,
    OverrideStackFODragObjectsSizeCap: 4,
    AccelerationSpeedMultiplierByLevel: [0.6,0.6,0.6,0.7,0.9,1],
    DisableSuctionForStackElementsUntilHoleLevel: 4,
    DisableSuctionForNonStackElementsUntilHoleLevel: 1,
  },

  // 遊戲物理。Gravity 由模組參數控制。
  GamePhysicsConfig: {
    _enabled: true,
    Gravity: argNum("Gravity", -80),                // =arg Gravity
    EatMaxDepth: 5,
    EatMinDepth: 1,
    HolePhysicsV236Enabled: true,
    EatAdditionalDepthPerHeight: 0.5,
    FallingObjectsOverridesEnabled: true,
    FloorHolePhysicMaterial: null,
    InnerHolePhysicMaterial: null,
    FallingObjectsOverridesConfig: null,
  },

  // 黑洞模式(8 個關卡槽全套用)。開關由模組參數控制。
  BlackHoleConfig: {
    _enabled: true,
    ChaseModeEnabled: argBool("BlackHoleChaseMode", false),      // =arg BlackHoleChaseMode
    ChaseModeTime: 6,
    FrenzyModeEnabled: argBool("BlackHoleFrenzyMode", false),    // =arg BlackHoleFrenzyMode
    FrenzyModeTime: 6,
  },

  // 機器人物理。
  BotsConfig: {
    _enabled: true,
    BotsNewPhysics: true,
    BotsUnstuckFix: true,
    BotsUnstuckTimeout: 0.5,
  },

  // 自適應難度(陣列，留在 JS 編輯；索引=難度階段 0→12)。
  AdaptiveDifficultyConfig: {
    _enabled: true,
    BotsCount:   [6,7,8,9,10,11,12,13,14,15,16,17,18],
    EasyBots:    [4,4,4,4,4,4,4,4,4,4,2,2,2],
    MediumBots:  [2,2,2,2,2,2,2,2,2,3,5,6,6],
    HardBots:    [0,1,2,3,3,3,3,4,4,4,5,6,6],
    BiggerBots:  [0,0,1,1,1,2,2,2,3,3,3,4,4],
    ExtremeBots: [0,0,0,0,1,2,3,3,4,4,4,4,5],
    AdaptiveBotSize: false,
    AdaptiveBotCount: false,
    AdaptiveBotAggressivity: false,
    IncreaseTreshold: 3,
    RegressionTreshold: 6,
    FirstTimeAppearance: 0,
  },

  /* ───────────────────────── 2. 留存系統（開關由模組參數控制） ───────────────────────── */

  EnergySystemConfig: {
    _enabled: true,
    IsActive: argBool("EnergyActive", false),       // =arg EnergyActive
    MaxCap: 6,
    TimeRechargeMinutes: 2,
    HasRVCost: false,
    ExtraInFirstSession: 2,
    RefillCost: "[{\"Gems\":5}]",
  },
  LivesSystemConfig: {
    _enabled: true,
    IsActive: argBool("LivesActive", false),        // =arg LivesActive
    MaxCap: 5,
    TimeRechargeMinutes: 10,
    HasRVCost: true,
    ExtraLivesFirstSession: 3,
    RefillCost: "[{\"Gems\":5}]",
  },
  DailyRewardsConfig: {
    _enabled: true,
    IsActive: argBool("DailyRewardsActive", false), // =arg DailyRewardsActive
    EnableRV: true,
    Rewards: [
      "{Coins: 50}",
      "{Coins: 75}",
      "{Coins: 100} {Gems: 5} {Sandglass: 1}",
      "{Coins: 150} {Gems: 5}",
      "{Coins: 200} {Gems: 5}",
      "{Coins: 250} {Gems: 5} {Sandglass: 1}",
      "{Coins: 500} {Gems: 30} {Bigger: 1}",
    ],
  },
  DailyMissionsConfig: {
    _enabled: true,
    IsEnabled: argBool("DailyMissionsActive", false), // =arg DailyMissionsActive
    MinCoins: 50, MaxCoins: 200,
    MinGems: 3, MaxGems: 9,
    CoinsRounding: 10,
    MissionCooldown: 4,
    FirstTimeAppearance: 0,
    disabledMissions: [],
  },
  DailyCalendarConfig: {
    _enabled: true,
    IsEnabled: argBool("DailyCalendarActive", false), // =arg DailyCalendarActive
    MinGamesToShow: 1,
    ResetIfDayMissed: false,
  },

  /* ───────────────────────── 3. 造型 / Skin（SkinsFreeNoAds 控制） ───────────────────────── */
  // SkinsFreeNoAds=1：關掉 RV 專屬、7 個造型解鎖等級=1、替代花費=0(免費)。=0：不動,用伺服器原值。
  RewardedVideoSkinConfig: SKINS_FREE
    ? { _enabled: true, Active: true, RVOnlySkin: false, IndividualRV: false }
    : { _enabled: false },
  SkinUnlockConfig: SKINS_FREE
    ? { _enabled: true, UnlockLevel: 1, AlternativeRewardAmount: 0, AlternativeRewardCurrency: "coins" }
    : { _enabled: false },

  /* ───────────────────────── 4. 關卡時間（GameDurationMinutes 控制） ───────────────────────── */
  GameDurationConfig: {
    _enabled: true,
    GameDurationInSeconds: argNum("GameDurationMinutes", 15) * 60,  // =arg GameDurationMinutes×60
  },

  /* ───────────────────────── 5. 計分（FallingObjectScore 控制） ───────────────────────── */
  // 註：此欄只參數化 CityWallValue(城牆類掉落物分值);多數物件分數依大小由 App 端決定。
  FallingObjectPointOverrideConfig: {
    _enabled: true,
    Enabled: true,
    CityWallValue: argNum("FallingObjectScore", 5),  // =arg FallingObjectScore
  },

  /* ───────────────────────── 6. 過關金幣 / 經濟（模組參數控制） ───────────────────────── */
  // LevelCompleteCoins → 改 EconomyConfig.LevelCompleteRewards 的 Coins 金額(見下方邏輯)。
  LevelCompleteCoins: argNum("LevelCompleteCoins", 3000),  // =arg LevelCompleteCoins

  StageProgressionConfig: {
    _enabled: true,
    RewardMultiplier: argNum("RewardMultiplier", 1),       // =arg RewardMultiplier
  },

  LevelCoinsConfig: { _enabled: false, Active: false },    // 非金幣來源,不動

};
/* ===================== CONFIG 可編輯區結束 ===================== */


/* ===================== 以下為執行邏輯,一般不需更動 ===================== */
(function () {
  if (!ENABLED) { return $done({}); }

  var isResponse = (typeof $response !== "undefined") && $response;

  /* ---------- 請求端：改寫送出的 level 參數(回報等級) ---------- */
  if (!isResponse) {
    try {
      var lvl = argNum("ReportedLevel", 5);
      var url = $request.url.replace(/([?&]level=)[^&]*/, "$1" + lvl);
      console.log("[Holeio][req] 回報等級改為 " + lvl);
      return $done({ url: url });
    } catch (e) {
      console.log("[Holeio][req] 改寫失敗: " + e);
      return $done({});
    }
  }

  /* ---------- 回應端：改寫 /api/settings 內容 ---------- */
  var root;
  try {
    root = JSON.parse($response.body);
  } catch (e) {
    console.log("[Holeio][resp] 回應不是合法 JSON,略過。 " + e);
    return $done({});
  }

  var changed = 0;

  function applyBlock(key, fields) {
    if (!fields || typeof fields !== "object" || fields._enabled === false) return;
    var list = root[key];
    if (!Array.isArray(list)) { console.log("[Holeio] 找不到設定項: " + key); return; }
    list.forEach(function (variant) {
      if (!variant || typeof variant !== "object") return;
      Object.keys(fields).forEach(function (f) {
        if (f.charAt(0) === "_") return;
        if (fields[f] === null || fields[f] === undefined) return;
        variant[f] = fields[f];
        changed++;
      });
    });
  }

  // 把形如 "{Coins: 900}" 的字串裡的金額換掉
  function setBraceCoins(str, n) {
    return str.replace(/(\{\s*Coins\s*:\s*)\d+(\s*\})/, "$1" + n + "$2");
  }

  // 特殊處理 1：過關金幣 → EconomyConfig.LevelCompleteRewards(JSON 陣列字串)內的 Coins 金額
  if (CONFIG.LevelCompleteCoins != null && Array.isArray(root.EconomyConfig) && root.EconomyConfig[0]) {
    try {
      var ec = root.EconomyConfig[0];
      var arr = JSON.parse(ec.LevelCompleteRewards);
      arr.forEach(function (g) {
        (g.rewards || []).forEach(function (r) {
          if (r.type === "Coins") r.amount = CONFIG.LevelCompleteCoins;
        });
      });
      ec.LevelCompleteRewards = JSON.stringify(arr);
      changed++;
      console.log("[Holeio][resp] 過關金幣設為 " + CONFIG.LevelCompleteCoins);
    } catch (e) {
      console.log("[Holeio][resp] 改過關金幣失敗: " + e);
    }
  }

  // 特殊處理 2：EconomyConfig 其他「{Coins: N}」類金額(由模組參數控制)
  if (Array.isArray(root.EconomyConfig) && root.EconomyConfig[0]) {
    var ec0 = root.EconomyConfig[0];
    var ECON = {
      AdOrPayRewards:      argNum("AdOrPayCoins", 1500),
      CrazyPackRewards:    argNum("CrazyPackCoins", 4000),
      PremiumOfferRewards: argNum("PremiumOfferCoins", 1500),
      BuyLivesCost:        argNum("BuyLivesCost", 900),
      BuyEnergyCost:       argNum("BuyEnergyCost", 900),
    };
    Object.keys(ECON).forEach(function (field) {
      if (ECON[field] == null) return;
      if (typeof ec0[field] === "string") {
        ec0[field] = setBraceCoins(ec0[field], ECON[field]);
        changed++;
      }
    });
  }

  Object.keys(CONFIG).forEach(function (key) {
    if (key === "LevelCompleteCoins") return;  // 特殊鍵,已單獨處理
    applyBlock(key, CONFIG[key]);
  });

  console.log("[Holeio][resp] 已覆寫 " + changed + " 個欄位。時間="
    + CONFIG.GameDurationConfig.GameDurationInSeconds + "秒, 金幣="
    + CONFIG.LevelCompleteCoins + ", 免廣告造型=" + SKINS_FREE);

  $done({ body: JSON.stringify(root) });
})();
