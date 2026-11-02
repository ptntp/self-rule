/**
 * Hole.io Local Tuning for Surge | 2026-11-02
 * 依使用者提供的 Hole.io 2.57.6 遠端設定結構製作。
 * 使用同資料夾中的 .sgmodule 參數表修改設定；不需改寫這份 JavaScript。
 * 預設不改值，無外部請求，不修改帳號、收據、商品 ID 或廣告配置。
 * 結構不相容的欄位略過；所有有效更新均限於既有欄位。
 */
(() => {
  'use strict';
  const PARAMETERS = {
    SpeedMultiplier: {"kind": "number", "default": "1", "min": 0.1, "max": 10},
    SizeMultiplier: {"kind": "number", "default": "1", "min": 0.1, "max": 10},
    XPMultiplier: {"kind": "number", "default": "1", "min": 0.01, "max": 100},
    GameSeconds: {"kind": "int", "default": "keep", "min": 1, "max": 86400},
    StageSeconds: {"kind": "int", "default": "keep", "min": 1, "max": 86400},
    ScoreGoal: {"kind": "int", "default": "keep", "min": 1, "max": 2147483647},
    PercentGoal: {"kind": "number", "default": "keep", "min": 0.1, "max": 100},
    Gravity: {"kind": "number", "default": "keep", "min": -1000, "max": 1000},
    SuctionEnabled: {"kind": "bool", "default": "keep"},
    UseStageXP: {"kind": "bool", "default": "keep"},
    LevelRegistriesEnabled: {"kind": "bool", "default": "keep"},
    ForceBalanceId: {"kind": "id", "default": "keep"},
    LevelReward: {"kind": "int", "default": "keep", "min": 0, "max": 2147483647},
    RandomSkinCost: {"kind": "int", "default": "keep", "min": 0, "max": 2147483647},
    BiggerCost: {"kind": "int", "default": "keep", "min": 0, "max": 2147483647},
    SandglassCost: {"kind": "int", "default": "keep", "min": 0, "max": 2147483647},
    FreeCoins: {"kind": "int", "default": "keep", "min": 0, "max": 2147483647},
    FreeCoinsCooldownMinutes: {"kind": "int", "default": "keep", "min": 0, "max": 10080},
    CoinsPack0: {"kind": "int", "default": "keep", "min": 0, "max": 2147483647},
    CoinsPack1: {"kind": "int", "default": "keep", "min": 0, "max": 2147483647},
    CoinsPack2: {"kind": "int", "default": "keep", "min": 0, "max": 2147483647},
    InitialCoins: {"kind": "int", "default": "keep", "min": 0, "max": 2147483647},
    InitialGems: {"kind": "int", "default": "keep", "min": 0, "max": 2147483647},
    InitialBattery: {"kind": "int", "default": "keep", "min": 0, "max": 2147483647},
    GemsRemoved: {"kind": "bool", "default": "keep"},
    NoAdsTimeLimited: {"kind": "bool", "default": "keep"},
    NoAdsSeconds: {"kind": "int", "default": "keep", "min": 1, "max": 2147483647},
    InGameBoosters: {"kind": "bool", "default": "keep"},
    PregameBoosters: {"kind": "bool", "default": "keep"},
    BiggerUnlock: {"kind": "int", "default": "keep", "min": 0, "max": 2147483647},
    SandglassUnlock: {"kind": "int", "default": "keep", "min": 0, "max": 2147483647},
    BiggerInitial: {"kind": "int", "default": "keep", "min": 0, "max": 2147483647},
    SandglassInitial: {"kind": "int", "default": "keep", "min": 0, "max": 2147483647},
    LegacyBiggerPrice: {"kind": "int", "default": "keep", "min": 0, "max": 2147483647},
    LegacySandglassPrice: {"kind": "int", "default": "keep", "min": 0, "max": 2147483647},
    SandglassSeconds: {"kind": "int", "default": "keep", "min": 1, "max": 86400},
    ContinueEnabled: {"kind": "bool", "default": "keep"},
    ContinueFreeFirst: {"kind": "bool", "default": "keep"},
    ContinueSeconds: {"kind": "int", "default": "keep", "min": 1, "max": 86400},
    ContinueRVValue: {"kind": "int", "default": "keep", "min": 0, "max": 2147483647},
    ExtraTimeEnabled: {"kind": "bool", "default": "keep"},
    ExtraSeconds: {"kind": "int", "default": "keep", "min": 1, "max": 86400},
    SecondExtraEnabled: {"kind": "bool", "default": "keep"},
    SecondExtraSeconds: {"kind": "int", "default": "keep", "min": 1, "max": 86400},
    SecondExtraAfterSessions: {"kind": "int", "default": "keep", "min": 0, "max": 2147483647},
    LivesEnabled: {"kind": "bool", "default": "keep"},
    EnergyEnabled: {"kind": "bool", "default": "keep"},
    LifeCap: {"kind": "int", "default": "keep", "min": 1, "max": 1000000},
    EnergyCap: {"kind": "int", "default": "keep", "min": 1, "max": 1000000},
    LifeRechargeMinutes: {"kind": "int", "default": "keep", "min": 1, "max": 10080},
    EnergyRechargeMinutes: {"kind": "int", "default": "keep", "min": 1, "max": 10080},
    BuyLivesCost: {"kind": "int", "default": "keep", "min": 0, "max": 2147483647},
    BuyEnergyCost: {"kind": "int", "default": "keep", "min": 0, "max": 2147483647}
  };

  const TAG = '[HoleioLocalTuning]';
  const INT_MAX = 2147483647;
  const own = (obj, key) => obj !== null && typeof obj === 'object' && Object.prototype.hasOwnProperty.call(obj, key);
  const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const list = value => Array.isArray(value) ? value : [];
  const log = message => console.log(TAG + ' ' + message);
  const finish = value => $done(value || {});

  // 只處理目標遊戲的成功設定回應。無須帳號、裝置識別碼或外部連線。
  if (typeof $request === 'undefined' || typeof $response === 'undefined') return finish();
  const url = String($request.url || '');
  const target = /^https:\/\/remote-settings-v2\.voodoo-tech\.io\/api\/settings\?(?:[^&#]*&)*bundle_id=com\.nguyenvh\.holeio(?:&|$)/;
  if (!target.test(url) || Number($response.status) !== 200 || typeof $response.body !== 'string') return finish();

  function readArguments(text) {
    const input = Object.create(null);
    String(text || '').split('&').forEach(part => {
      const i = part.indexOf('=');
      if (i < 1) return;
      try {
        const key = decodeURIComponent(part.slice(0, i));
        const value = decodeURIComponent(part.slice(i + 1));
        if (own(PARAMETERS, key)) input[key] = value;
      } catch (_) {
        log('略過無法解碼的參數。');
      }
    });
    const settings = Object.create(null);
    Object.keys(PARAMETERS).forEach(name => {
      const spec = PARAMETERS[name];
      let raw = own(input, name) ? String(input[name]).trim() : '';
      if (raw === '') raw = spec.default;
      if (raw.toLowerCase() === 'keep' || raw.indexOf('{{{') !== -1) {
        settings[name] = null;
        return;
      }
      if (spec.kind === 'bool') {
        const b = raw.toLowerCase();
        if (b === 'true' || b === '1') settings[name] = true;
        else if (b === 'false' || b === '0') settings[name] = false;
        else settings[name] = null;
      } else if (spec.kind === 'id') {
        settings[name] = /^[A-Za-z0-9_-]{1,64}$/.test(raw) ? raw : null;
      } else {
        const syntaxOK = spec.kind === 'int'
          ? /^\d+$/.test(raw)
          : /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(raw);
        const n = syntaxOK ? Number(raw) : NaN;
        const valid = Number.isFinite(n) && n >= spec.min && n <= spec.max &&
          (spec.kind !== 'int' || Number.isSafeInteger(n));
        settings[name] = valid ? n : null;
      }
      if (settings[name] === null) log(name + ' 無效或超出範圍；保留原值。');
    });
    return settings;
  }

  const options = readArguments(typeof $argument === 'string' ? $argument : '');
  let edits = 0;
  const selected = name => options[name] !== null;
  const any = names => names.some(selected);

  // 僅改寫已存在、型別相容的欄位。不插入假設中的 key。
  function put(obj, key, value) {
    if (value === null || !own(obj, key) || typeof obj[key] !== typeof value) return;
    if (typeof value === 'number' && !Number.isFinite(value)) return;
    if (obj[key] !== value) {
      obj[key] = value;
      edits++;
    }
  }
  function fixed(obj, key, argument) { put(obj, key, options[argument]); }
  function scale(obj, key, argument, integer) {
    const multiplier = options[argument];
    if (multiplier === null || multiplier === 1 || !own(obj, key)) return;
    const original = obj[key];
    // XP 的 0 和 -1 等特殊值必須保留；不猜測未知負值的用途。
    if (typeof original !== 'number' || !Number.isFinite(original) || original <= 0) return;
    let result = original * multiplier;
    result = integer ? Math.max(1, Math.round(result)) : Math.round(result * 1000000) / 1000000;
    if (!Number.isFinite(result) || result > INT_MAX || result <= 0) return;
    put(obj, key, result);
  }
  function embedded(obj, key, visit) {
    if (!own(obj, key)) return;
    let data;
    const asString = typeof obj[key] === 'string';
    if (asString) {
      try { data = JSON.parse(obj[key]); }
      catch (_) { log(key + ' 不是有效 JSON；略過此欄位。'); return; }
    } else if (obj[key] !== null && typeof obj[key] === 'object') {
      data = obj[key];
    } else return;
    if (data === null || typeof data !== 'object') return;
    const before = edits;
    visit(data);
    // 維持原本的外層字串／物件型別；未改值時不重排內嵌字串。
    if (asString && edits !== before) obj[key] = JSON.stringify(data);
  }
  function eachGroup(data, child, visit) {
    if (!record(data)) return;
    Object.keys(data).forEach(key => {
      if (record(data[key])) list(data[key][child]).forEach(item => {
        if (record(item)) visit(item);
      });
    });
  }
  function coinCost(config, key, argument) {
    if (!selected(argument) || !own(config, key) || typeof config[key] !== 'string') return;
    // 這是遊戲自訂 {Coins: n} 格式，不是 JSON。不改變貨幣種類。
    const result = config[key].replace(/^(\s*\{\s*Coins\s*:\s*)[+-]?\d+(?:\.\d+)?(\s*\}\s*)$/, (_, prefix, suffix) => prefix + options[argument] + suffix);
    put(config, key, result);
  }
  function coinReward(rewards, argument) {
    if (!selected(argument)) return;
    list(rewards).forEach(reward => {
      if (record(reward) && reward.type === 'Coins') fixed(reward, 'amount', argument);
    });
  }
  function indexedBooster(config, field, booster, argument) {
    if (!selected(argument) || !Array.isArray(config.PregameBoosters) || !Array.isArray(config[field])) return;
    config.PregameBoosters.forEach((name, index) => {
      if (name === booster && index < config[field].length) fixed(config[field], index, argument);
    });
  }

  try {
    const body = JSON.parse($response.body.replace(/^\uFEFF/, ''));
    if (!record(body)) return finish();
    const configs = name => list(body[name]).filter(record);

    // 第一項：平衡方案、XP、關卡時間與目標。
    const availableBalances = Object.create(null);
    configs('GameBalanceConfig').forEach(config => {
      embedded(config, 'BalanceConfigJson', balance => {
        if (!record(balance)) return;
        if (typeof config.Id === 'string' && list(balance.HoleBalance).length > 0) availableBalances[config.Id] = true;
        fixed(balance, 'Gravity', 'Gravity');
        fixed(balance, 'SuctionEnabled', 'SuctionEnabled');
        list(balance.HoleBalance).forEach(row => {
          if (!record(row)) return;
          scale(row, 'Speed', 'SpeedMultiplier', false);
          scale(row, 'Size', 'SizeMultiplier', false);
          scale(row, 'XP', 'XPMultiplier', true);
        });
      });
    });
    if (selected('ForceBalanceId')) {
      if (availableBalances[options.ForceBalanceId] === true) {
        configs('LevelProgressionConfig').forEach(config => embedded(config, 'LevelProgression', progression => {
          eachGroup(progression, 'levels', level => fixed(level, 'gameBalanceId', 'ForceBalanceId'));
        }));
      } else log('ForceBalanceId 不在有效平衡方案中；保留原引用。');
    }
    configs('GameDurationConfig').forEach(config => fixed(config, 'GameDurationInSeconds', 'GameSeconds'));
    configs('StageProgressionLevelRegistryConfig').forEach(config => {
      fixed(config, 'EnableLevelRegistries', 'LevelRegistriesEnabled');
      if (!any(['GameSeconds', 'StageSeconds', 'ScoreGoal', 'PercentGoal', 'UseStageXP']) &&
          (options.XPMultiplier === null || options.XPMultiplier === 1)) return;
      embedded(config, 'LevelRegistryConfig', registry => {
        eachGroup(registry, 'stages', stage => {
          put(stage, 'duration', selected('StageSeconds') ? options.StageSeconds : options.GameSeconds);
          if (Array.isArray(stage.xpTable)) {
            fixed(stage, 'overrideXpTable', 'UseStageXP');
            stage.xpTable.forEach((_, index) => scale(stage.xpTable, index, 'XPMultiplier', true));
          }
          if (typeof stage.goals === 'string') {
            let goals = stage.goals;
            if (selected('ScoreGoal')) {
              goals = goals.replace(/(\{\s*Score\s*,\s*)[+-]?(?:\d+(?:\.\d*)?|\.\d+)(\s*\})/g,
                (_, prefix, suffix) => prefix + options.ScoreGoal + suffix);
            }
            if (selected('PercentGoal')) {
              goals = goals.replace(/(\{\s*Percent\s*,\s*)[+-]?(?:\d+(?:\.\d*)?|\.\d+)(\s*\})/g,
                (_, prefix, suffix) => prefix + options.PercentGoal + suffix);
            }
            put(stage, 'goals', goals);
          }
        });
      });
    });

    // 第三項：經濟、獎勵及商品設定。商品 ID、收據與權益不變。
    configs('EconomyConfig').forEach(config => {
      fixed(config, 'IsGemsRemoved', 'GemsRemoved');
      coinCost(config, 'BuyRandomSkinCost', 'RandomSkinCost');
      coinCost(config, 'BuyLivesCost', 'BuyLivesCost');
      coinCost(config, 'BuyEnergyCost', 'BuyEnergyCost');
      if (selected('LevelReward')) embedded(config, 'LevelCompleteRewards', rewards => {
        list(rewards).forEach(row => {
          if (record(row) && row.id === 'standard_end_level_reward') coinReward(row.rewards, 'LevelReward');
        });
      });
      if (any(['BiggerCost', 'SandglassCost'])) embedded(config, 'BuyPregameBoosterCost', costs => {
        list(costs).forEach(row => {
          if (!record(row)) return;
          if (row.BoosterType === 'Bigger') coinReward(row.cost, 'BiggerCost');
          if (row.BoosterType === 'Sandglass') coinReward(row.cost, 'SandglassCost');
        });
      });
      if (any(['FreeCoins', 'CoinsPack0', 'CoinsPack1', 'CoinsPack2'])) embedded(config, 'ShopRewards', shop => {
        if (!record(shop)) return;
        list(shop.deals).forEach(row => {
          if (record(row) && row.id === 'free_coins' && row.type === 'Coins') fixed(row, 'amount', 'FreeCoins');
        });
        list(shop.coins).forEach(row => {
          if (!record(row) || row.type !== 'Coins') return;
          for (let i = 0; i < 3; i++) {
            if (row.id === 'coins_' + i) fixed(row, 'amount', 'CoinsPack' + i);
          }
        });
      });
      if (any(['BiggerCost', 'SandglassCost', 'FreeCoinsCooldownMinutes'])) embedded(config, 'ShopPayments', shop => {
        if (!record(shop)) return;
        list(shop.boosters).forEach(row => {
          if (!record(row) || row.type !== 'Coins') return;
          if (row.id === 'booster_bigger') fixed(row, 'amount', 'BiggerCost');
          if (row.id === 'booster_sandglass') fixed(row, 'amount', 'SandglassCost');
        });
        if (selected('FreeCoinsCooldownMinutes')) list(shop.deals).forEach(row => {
          if (record(row) && row.id === 'free_coins') put(row, 'waitTime', options.FreeCoinsCooldownMinutes * 60);
        });
      });
    });
    configs('StoreConfig').forEach(config => {
      fixed(config, 'FreeCoins', 'FreeCoins');
      fixed(config, 'FreeCoinsCooldownInMinutes', 'FreeCoinsCooldownMinutes');
    });
    if (any(['InitialCoins', 'InitialGems', 'InitialBattery'])) configs('InventoryInitialResourcesConfig').forEach(config => {
      embedded(config, 'Rewards', rewards => {
        list(rewards).forEach(row => {
          if (!record(row)) return;
          fixed(row, 'Coins', 'InitialCoins');
          fixed(row, 'Gems', 'InitialGems');
          fixed(row, 'Battery4XMap', 'InitialBattery');
        });
      });
    });
    configs('NoAdsConfig').forEach(config => {
      fixed(config, 'IsTimeLimited', 'NoAdsTimeLimited');
      fixed(config, 'TimedNoAdsDurationSeconds', 'NoAdsSeconds');
    });

    // 第四項：道具、加時、續命與生命／能量。
    configs('BoostersConfig').forEach(config => {
      fixed(config, 'Active', 'InGameBoosters');
      fixed(config, 'PreGameActive', 'PregameBoosters');
      indexedBooster(config, 'PregameUnlock', 'Bigger', 'BiggerUnlock');
      indexedBooster(config, 'PregameUnlock', 'Sandglass', 'SandglassUnlock');
      indexedBooster(config, 'PreGameInitialQuantity', 'Bigger', 'BiggerInitial');
      indexedBooster(config, 'PreGameInitialQuantity', 'Sandglass', 'SandglassInitial');
      indexedBooster(config, 'PregamePrice', 'Bigger', 'LegacyBiggerPrice');
      indexedBooster(config, 'PregamePrice', 'Sandglass', 'LegacySandglassPrice');
      fixed(config, 'SandglassTime', 'SandglassSeconds');
      indexedBooster(config, 'PreGameDuration', 'Sandglass', 'SandglassSeconds');
    });
    const mappings = {
      ContinueOfferConfig: { Active: 'ContinueEnabled', FreeFirstUse: 'ContinueFreeFirst', ExtraTimeValue: 'ContinueSeconds', ContinueWithRV: 'ContinueRVValue' },
      ExtraTimeConfig: { ExtraTimeEnabled: 'ExtraTimeEnabled', ExtraTime: 'ExtraSeconds', SecondExtraTimeEnabled: 'SecondExtraEnabled', SecondExtraTime: 'SecondExtraSeconds', SecondExtraTimeEnabledAfterSessions: 'SecondExtraAfterSessions' },
      LivesSystemConfig: { IsActive: 'LivesEnabled', MaxCap: 'LifeCap', TimeRechargeMinutes: 'LifeRechargeMinutes' },
      EnergySystemConfig: { IsActive: 'EnergyEnabled', MaxCap: 'EnergyCap', TimeRechargeMinutes: 'EnergyRechargeMinutes' }
    };
    Object.keys(mappings).forEach(section => {
      configs(section).forEach(config => {
        Object.keys(mappings[section]).forEach(key => fixed(config, key, mappings[section][key]));
      });
    });

    if (edits === 0) {
      log('未改寫：參數保留原值、設定值相同，或目標欄位不存在。');
      return finish();
    }
    log('已改寫 ' + edits + ' 個既有欄位；未修改廣告系統或購買權益。');
    return finish({ body: JSON.stringify(body) });
  } catch (_) {
    // 不輸出原始回應、URL 或任何識別碼。
    log('回應解析或處理失敗；完整保留原始回應。');
    return finish();
  }
})();
