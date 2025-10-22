/*
作者：keywos wuhu@wuhu_zzz 整點貓咪
自定義icon、iconerr及icon-color，利用argument參數傳遞，不同參數用&鏈接
icon：支持⭕️chatgpt時的圖標，
iconerr：不支持❌chatgpt時的圖標，
icon-color：正常能使用時圖標的顏色
iconerr-color：不能使用時圖標顏色
如：argument=icon=lasso.and.sparkles&iconerr=xmark.seal.fill&icon-color=#336FA9&iconerr-color=#D65C51
注⚠️：當想要自定義圖標，必須要本地編輯，即保存在主配置中
*/

let url = "http://chat.openai.com/cdn-cgi/trace";
let tf=["T1","XX","AL","DZ","AD","AO","AG","AR","AM","AU","AT","AZ","BS","BD","BB","BE","BZ","BJ","BT","BA","BW","BR","BG","BF","CV","CA","CL","CO","KM","CR","HR","CY","DK","DJ","DM","DO","EC","SV","EE","FJ","FI","FR","GA","GM","GE","DE","GH","GR","GD","GT","GN","GW","GY","HT","HN","HU","IS","IN","ID","IQ","IE","IL","IT","JM","JP","JO","KZ","KE","KI","KW","KG","LV","LB","LS","LR","LI","LT","LU","MG","MW","MY","MV","ML","MT","MH","MR","MU","MX","MC","MN","ME","MA","MZ","MM","NA","NR","NP","NL","NZ","NI","NE","NG","MK","NO","OM","PK","PW","PA","PG","PE","PH","PL","PT","QA","RO","RW","KN","LC","VC","WS","SM","ST","SN","RS","SC","SL","SG","SK","SI","SB","ZA","ES","LK","SR","SE","CH","TH","TG","TO","TT","TN","TR","TV","UG","AE","US","UY","VU","ZM","BO","BN","CG","CZ","VA","FM","MD","PS","KR","TW","TZ","TL","GB"];
let tff=["plus","on"];

// 處理 argument 參數
let titlediy, icon, iconerr, iconColor, iconerrColor;
if (typeof $argument !== 'undefined') {
  const args = $argument.split('&');
  for (let i = 0; i < args.length; i++) {
  const [key, value] = args[i].split('=');
  if (key === 'title') {
    titlediy = value;
  } else if (key === 'icon') {
    icon = value;
  } else if (key === 'iconerr') {
    iconerr = value;
  } else if (key === 'icon-color') {
    iconColor = value;
  } else if (key === 'iconerr-color') {
    iconerrColor = value;
  }
  }
}

// 發送 HTTP 請求獲取所在地信息
$httpClient.get(url, function(error, response, data){
  if (error) {
  console.error(error);
  $done();
  return;
  }

  let lines = data.split("\n");
  let cf = lines.reduce((acc, line) => {
  let [key, value] = line.split("=");
  acc[key] = value;
  return acc;
  }, {});
  let ip = cf.ip;
  let warp = cf.warp;
  let loc = getCountryFlagEmoji(cf.loc) + cf.loc;

  // 判斷 ChatGPT 是否支持該國家/地區
  let l = tf.indexOf(cf.loc);
  let gpt, iconUsed;
  if (l !== -1) {
  gpt = "GPT: ⭕️";
  iconUsed = icon ? icon : undefined;
  iconCol = iconColor ? iconColor : undefined;

  } else {
  gpt = "GPT: ❌";
  iconUsed = iconerr ? iconerr : undefined;
  iconCol = iconerrColor ? iconerrColor : undefined;

  }

  // 獲取 Warp 狀態
  let w = tff.indexOf(warp);
  let warps;
  if (w !== -1) {
  warps = "⭕️";
  } else {
  warps = "❌";
  }

  // 組裝通知數據
  let body = {
    title: titlediy ? titlediy : 'ChatGPT',
    content: `${gpt}   區域: ${loc}   Warp: ${warps}`,
    icon: iconUsed ? iconUsed : undefined,
    'icon-color': iconCol ? iconCol : undefined
  };

  // 發送通知
  $done(body);
});
//獲取國旗Emoji函數
function getCountryFlagEmoji(countryCode) {
    if (countryCode.toUpperCase() == 'TW') {
      countryCode = 'TW'
    }
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt())
    return String.fromCodePoint(...codePoints)
}
