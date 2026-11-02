/*
 * ============================================================================
 *  Hole.io 核心玩法 + 留存系統 ── 本機測試改寫腳本 (Surge iOS http-response)
 * ============================================================================
 *  作用：攔截 remote-settings-v2.voodoo-tech.io 的 /api/settings 回應，
 *       把你在下方 CONFIG 區塊設定的數值「蓋」到伺服器回傳的設定上，
 *       其餘 234 個設定維持原樣，再交給 App。用來測試不同數值的效果。
 *
 *  怎麼改：只需要改下方「CONFIG 可編輯區」。
 *     - 數值直接改成你要的值。
 *     - 設成 null  = 這一欄不動，沿用伺服器原本的值。
 *     - 每個設定區塊的 _enabled:false = 整個設定都不覆寫。
 *     - ENABLED = false = 整支腳本停用（等於沒掛）。
 *
 *  注意：僅供你自己的裝置本機測試。改動只影響你手機收到的設定，不會上傳。
 * ============================================================================
 */

const ENABLED = true;   // 總開關：false = 完全不改寫

/* ======================= CONFIG 可編輯區（改這裡） ======================= */
const CONFIG = {

  /* ───────────────────────── 1. 核心玩法 ───────────────────────── */

  // 洞的成長門檻：陣列索引 = 洞的尺寸等級，值 = 升到該級所需累積吃掉的點數。
  // 值越小 → 洞長得越快。-1 = 封頂(不再長大)。三個難度各一條曲線。
  HoleGrowthConfig: {
    _enabled: true,
    Active: true,                                   // 是否啟用自訂成長曲線
    Normal:   [0,10,20,40,50,55,60,65,70,75,80,85,90,100,110,120,150,200,220,240,-1,-1], // 普通難度
    Hard:     [0,10,20,40,50,55,60,65,70,75,80,85,90,100,110,120,150,200,220,240,-1,-1], // 困難難度
    VeryHard: [0,10,20,40,50,55,60,65,70,75,80,85,90,100,110,120,150,200,220,240,-1,-1], // 極難難度
    // 範例：想「秒變大」可把前幾項改小，如 [0,2,4,6,8,...]
  },

  // 吸入手感：控制洞把物體吸進去的力道與滑順度。
  HoleSuctionConfig: {
    _enabled: true,
    Enabled: true,                                  // 吸力總開關
    AffectBots: false,                              // 吸力是否也影響機器人
    HeightBounds: 12,                               // 吸力作用的高度範圍
    SwallowFriction: 0.3,                           // 吞入摩擦，越小越滑溜(更好吸)
    UseAccelerationRamp: true,                      // 是否使用加速爬升
    TiltCorrectionStrength: 33,                     // 物體傾斜校正強度
    HeightSuctionMultiplier: 1.2,                   // 高度吸力倍率，越大吸得越猛
    AccelerationRampDuration: 0.3,                  // 加速爬升時間(秒)
    AccelerationRampStrength: 120,                  // 加速爬升強度
    StackFOLinearDragOverride: 4,                   // 堆疊物體的線性阻力
    MinHeightForTiltCorrection: 25,                 // 觸發傾斜校正的最小高度
    StackFOAngularDragOverride: 0.05,               // 堆疊物體的角阻力
    ReduceFrictionWhileSwallowing: true,            // 吞入時降低摩擦
    OverrideStackFODragObjectsSizeCap: 4,           // 堆疊阻力覆寫的尺寸上限
    AccelerationSpeedMultiplierByLevel: [0.6,0.6,0.6,0.7,0.9,1], // 各洞等級的加速倍率
    DisableSuctionForStackElementsUntilHoleLevel: 4,    // 洞達此等級前,堆疊元素不被吸
    DisableSuctionForNonStackElementsUntilHoleLevel: 1, // 洞達此等級前,非堆疊元素不被吸
  },

  // 遊戲物理：重力與吃入判定。
  GamePhysicsConfig: {
    _enabled: true,
    Gravity: -80,                                   // 重力,絕對值越大物體掉得越快
    EatMaxDepth: 5,                                 // 吃入判定最大深度
    EatMinDepth: 1,                                 // 吃入判定最小深度
    HolePhysicsV236Enabled: true,                   // 新版洞物理
    EatAdditionalDepthPerHeight: 0.5,               // 每單位高度增加的吃入深度
    FallingObjectsOverridesEnabled: true,           // 是否套用「各尺寸物體質量/阻力」覆寫表
    // 進階(值為 JSON 字串,想調就整串改,保持合法 JSON)：地面/洞內物理材質
    FloorHolePhysicMaterial: null,                  // null = 不動。原值:{"DynamicFriction":0.6,...}
    InnerHolePhysicMaterial: null,                  // null = 不動。原值:{"DynamicFriction":0.45,...}
    FallingObjectsOverridesConfig: null,            // null = 不動。各尺寸物體的質量/阻力表(很長)
  },

  // 黑洞模式：伺服器給 8 個變體(對應 8 個關卡槽),這裡會套用到全部 8 個。
  BlackHoleConfig: {
    _enabled: true,
    ChaseModeEnabled: false,                        // 追逐模式開關
    ChaseModeTime: 6,                               // 追逐模式持續秒數
    FrenzyModeEnabled: false,                       // 狂暴模式開關
    FrenzyModeTime: 6,                              // 狂暴模式持續秒數
  },

  // 機器人物理行為。
  BotsConfig: {
    _enabled: true,
    BotsNewPhysics: true,                           // 新版機器人物理
    BotsUnstuckFix: true,                           // 機器人卡住自動修正
    BotsUnstuckTimeout: 0.5,                         // 判定卡住的秒數
  },

  // 自適應難度：陣列索引 = 難度階段(0→12,越後面越難)。
  // 各欄是「場上該強度機器人的數量」。改這些 = 調整每關敵人組成。
  AdaptiveDifficultyConfig: {
    _enabled: true,
    BotsCount:   [6,7,8,9,10,11,12,13,14,15,16,17,18], // 場上機器人總數
    EasyBots:    [4,4,4,4,4,4,4,4,4,4,2,2,2],          // 弱機器人數量
    MediumBots:  [2,2,2,2,2,2,2,2,2,3,5,6,6],          // 中等機器人數量
    HardBots:    [0,1,2,3,3,3,3,4,4,4,5,6,6],          // 強機器人數量
    BiggerBots:  [0,0,1,1,1,2,2,2,3,3,3,4,4],          // 較大機器人數量
    ExtremeBots: [0,0,0,0,1,2,3,3,4,4,4,4,5],          // 極強機器人數量
    AdaptiveBotSize: false,                         // 依玩家表現動態調整機器人大小
    AdaptiveBotCount: false,                        // 依玩家表現動態調整機器人數量
    AdaptiveBotAggressivity: false,                 // 依玩家表現動態調整機器人侵略性
    IncreaseTreshold: 3,                            // 連勝幾場後升難度
    RegressionTreshold: 6,                          // 連敗幾場後降難度
    FirstTimeAppearance: 0,                         // 從第幾關開始套用
  },

  /* ───────────────────────── 2. 留存系統 ───────────────────────── */

  // 體力系統(玩一局扣體力的機制)。測試重點是 IsActive。
  EnergySystemConfig: {
    _enabled: true,
    IsActive: false,                                // ★ 體力系統總開關(true=開啟體力牆)
    MaxCap: 6,                                       // 體力上限
    TimeRechargeMinutes: 2,                          // 每點體力回復所需分鐘數
    HasRVCost: false,                                // 是否可看廣告補體力
    ExtraInFirstSession: 2,                          // 首次遊玩額外贈送
    RefillCost: "[{\"Gems\":5}]",                   // 補滿花費(JSON 字串)
  },

  // 生命系統(失敗扣命的機制)。測試重點是 IsActive。
  LivesSystemConfig: {
    _enabled: true,
    IsActive: false,                                // ★ 生命系統總開關
    MaxCap: 5,                                       // 生命上限
    TimeRechargeMinutes: 10,                         // 每條命回復所需分鐘數
    HasRVCost: true,                                 // 是否可看廣告補命
    ExtraLivesFirstSession: 3,                       // 首次遊玩額外贈送
    RefillCost: "[{\"Gems\":5}]",                   // 補滿花費(JSON 字串)
  },

  // 每日登入獎勵(7 天)。
  DailyRewardsConfig: {
    _enabled: true,
    IsActive: false,                                // ★ 每日獎勵總開關
    EnableRV: true,                                  // 是否可看廣告翻倍
    // 第 1~7 天的獎勵。格式:"{Coins:50}" 或 "{Coins:100} {Gems:5} {Sandglass:1}"
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

  // 每日任務。
  DailyMissionsConfig: {
    _enabled: true,
    IsEnabled: false,                               // ★ 每日任務總開關
    MinCoins: 50,                                    // 任務獎勵金幣下限
    MaxCoins: 200,                                   // 任務獎勵金幣上限
    MinGems: 3,                                      // 任務獎勵寶石下限
    MaxGems: 9,                                       // 任務獎勵寶石上限
    CoinsRounding: 10,                               // 金幣取整單位
    MissionCooldown: 4,                              // 任務冷卻(小時)
    FirstTimeAppearance: 0,                          // 從第幾關/第幾次開始出現
    disabledMissions: [],                            // 停用的任務 ID 清單
  },

  // 每日月曆(簽到日曆)。
  DailyCalendarConfig: {
    _enabled: true,
    IsEnabled: false,                               // ★ 每日月曆總開關
    MinGamesToShow: 1,                               // 至少玩幾局才顯示
    ResetIfDayMissed: false,                         // 漏一天是否整個重置
  },

  /* ───────────────────────── 3. 造型 / Skin ───────────────────────── */

  // 免廣告取得造型：把「RV 專屬」關掉，讓造型不再鎖在看廣告後面。
  // 註：造型最終是否發放由 App 端判定，這裡改的是「解鎖規則」，請進遊戲實測。
  //     付費(IAP)造型不受此影響，依你需求不處理。
  RewardedVideoSkinConfig: {
    _enabled: true,
    Active: true,                                   // 造型功能開啟
    RVOnlySkin: false,                              // ★ false = 造型不再「只能看廣告解鎖」
    IndividualRV: false,                            // 是否每個造型各自看一次廣告
  },

  // 各造型的解鎖等級(7 個造型會全部套用同一個值)。
  // UnlockLevel=1 = 一開始就可解鎖；AlternativeRewardAmount=0 = 免費(原預設看廣告或付100金幣)。
  SkinUnlockConfig: {
    _enabled: true,
    UnlockLevel: 1,                                 // ★ 解鎖所需等級(1=立刻可解)
    AlternativeRewardAmount: 0,                     // ★ 替代解鎖花費(0=免費；原預設100)
    AlternativeRewardCurrency: "coins",             // 替代解鎖幣別(遊戲內金幣)
  },

  /* ───────────────────────── 4. 關卡時間 ───────────────────────── */

  // 每局時間。15 分鐘 = 900 秒。改這個數字即可。
  // 註：少數關卡可能自帶時間覆寫，此為全域預設值。
  GameDurationConfig: {
    _enabled: true,
    GameDurationInSeconds: 900,                     // ★ 關卡時間(秒)。15分=900、10分=600、5分=300
  },

  /* ───────────────────────── 5. 計分（掉落物/黑洞得分） ───────────────────────── */

  // 掉進洞的掉落物計分覆寫。把分值設成 5。
  // 註：此設定目前只參數化 CityWallValue(城牆類掉落物分值)；Hole.io 多數物件分數
  //     依「物件大小」由 App 端決定，遠端設定沒有單一「全部物件=5」的欄位。
  FallingObjectPointOverrideConfig: {
    _enabled: true,
    Enabled: true,                                  // 掉落物計分覆寫開關
    CityWallValue: 5,                               // ★ 掉落物分值
  },

  /* ──────────────────── 6. 過關金幣（已確認來源） ──────────────────── */

  // ★ 每關完成給的金幣。來源已確認：EconomyConfig.LevelCompleteRewards(原預設 200)。
  //    腳本會解析該欄位、只改裡面的 Coins 金額、再存回，不動其他經濟設定。
  //    直接改這個數字即可；設成 null = 不改。
  LevelCompleteCoins: 3000,

  // (選用) 關卡獎勵倍率：把 1 調大 = 連同其他關卡獎勵一起等比放大。1 = 不變。
  StageProgressionConfig: {
    _enabled: true,
    RewardMultiplier: 1,                            // 關卡獎勵倍率
  },

  // 註：LevelCoinsConfig 原本只有 {Active:false}，不是金幣金額來源，故預設不動它。
  LevelCoinsConfig: {
    _enabled: false,
    Active: false,
  },

};
/* ===================== CONFIG 可編輯區結束 ===================== */


/* ===================== 以下為執行邏輯,一般不需更動 ===================== */
(function () {
  if (!ENABLED) { return $done({}); }

  let root;
  try {
    root = JSON.parse($response.body);
  } catch (e) {
    console.log("[Holeio] 回應不是合法 JSON,略過。 " + e);
    return $done({});
  }

  let changed = 0;

  function applyBlock(key, fields) {
    if (!fields || typeof fields !== "object" || fields._enabled === false) return;
    const list = root[key];
    if (!Array.isArray(list)) {
      console.log("[Holeio] 找不到設定項或格式非預期: " + key);
      return;
    }
    list.forEach(function (variant) {
      if (!variant || typeof variant !== "object") return;
      Object.keys(fields).forEach(function (f) {
        if (f.charAt(0) === "_") return;          // 跳過 _enabled 這類控制欄
        if (fields[f] === null || fields[f] === undefined) return; // null = 不動
        variant[f] = fields[f];
        changed++;
      });
    });
  }

  // 特殊處理：過關金幣 → 改寫 EconomyConfig.LevelCompleteRewards 內的 Coins 金額
  var SPECIAL = { LevelCompleteCoins: true };
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
      console.log("[Holeio] 過關金幣設為 " + CONFIG.LevelCompleteCoins);
    } catch (e) {
      console.log("[Holeio] 改過關金幣失敗: " + e);
    }
  }

  Object.keys(CONFIG).forEach(function (key) {
    if (SPECIAL[key]) return;   // 特殊鍵不走通用流程
    applyBlock(key, CONFIG[key]);
  });

  console.log("[Holeio] 已覆寫 " + changed + " 個欄位 (" + Object.keys(CONFIG).length + " 個設定區塊)。");

  $done({ body: JSON.stringify(root) });
})();
