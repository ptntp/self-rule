/*
① 入口 IP（Cloudflare，DIRECT）
② 出口 IP（ip-api，代理）
③ Surge /v1/requests/recent 回讀真實代理策略
④ 風控等級（Scamalytics → IPPure 備用）
⑤ IP 類型（IPPure）
⑥ 地區 & 運營商（ip-api）
*/

let finished = false;

function done(o) {
  if (finished) return;
  finished = true;
  $done(o);
}

setTimeout(() => {
  done({
    title: "檢測超時",
    content: "API 請求超時",
    icon: "xmark.shield.fill",
    "icon-color": "#CD5C5C"
  });
}, 9000);

function httpJSON(url, policy) {
  return new Promise(r => {
    $httpClient.get(policy ? { url, policy } : { url }, (_, __, d) => {
      try { r(JSON.parse(d)); } catch { r(null); }
    });
  });
}

function httpRaw(url, policy) {
  return new Promise(r => {
    $httpClient.get(policy ? { url, policy } : { url }, (_, __, d) => r(d || null));
  });
}

function getPolicy() {
  return new Promise(r => {
    $httpAPI("GET", "/v1/requests/recent", null, res => {
      const hit = res?.requests
        ?.slice(0, 10)
        .find(i => /ip-api\.com\/json/i.test(i.URL));
      r(hit?.policyName || "DIRECT");
    });
  });
}

function flag(cc) {
  const b = 0x1f1e6;
  return cc && cc.length === 2
    ? String.fromCodePoint(b + cc.charCodeAt(0) - 65, b + cc.charCodeAt(1) - 65)
    : "";
}

function riskText(s) {
  if (s <= 15) return ["極度純淨 IP", "#006400"];
  if (s <= 25) return ["純淨 IP", "#3CB371"];
  if (s <= 40) return ["一般 IP", "#9ACD32"];
  if (s <= 50) return ["微風險 IP", "#FFD700"];
  if (s <= 70) return ["一般風險 IP", "#FF8C00"];
  return ["極度風險 IP", "#CD5C5C"];
}

function parseScore(html) {
  const m = html && html.match(/Fraud Score[^0-9]*([0-9]{1,3})/i);
  return m ? Number(m[1]) : null;
}

function parseCFTrace(text) {
  const m = text && text.match(/ip=([^\s]+)/);
  return m ? m[1] : null;
}

(async () => {
  // ① 入口 IP (Cloudflare)
  const cfTrace = await httpRaw(
    "https://1.1.1.1/cdn-cgi/trace",
    "DIRECT"
  );
  const inIP = parseCFTrace(cfTrace);

  // ② 出口 IP
  const exit = await httpJSON(
    "http://ip-api.com/json/?fields=query"
  );
  const outIP = exit?.query;

  if (!inIP || !outIP) {
    return done({
      title: "出口 IP 獲取失敗",
      content: "無法獲取入口或出口 IPv4",
      icon: "xmark.shield.fill",
      "icon-color": "#CD5C5C"
    });
  }

  // ③ 真實代理策略
  const policy = await getPolicy();

  // ④ 風控等級
  const ippure = await httpJSON("https://my.ippure.com/v1/info");
  let score = parseScore(await httpRaw(`https://scamalytics.com/ip/${outIP}`));
  if (score == null) score = Number(ippure?.fraudScore || 0);
  const [riskLabel, color] = riskText(score);

  // ⑤ IP 類型
  const ipType = ippure?.isResidential ? "住宅 IP" : "機房 IP";
  const ipSrc  = ippure?.isBroadcast  ? "廣播 IP" : "原生 IP";

  // ⑥ 地區 & 運營商
  const [inGeo, outGeo] = await Promise.all([
    httpJSON(`http://ip-api.com/json/${inIP}?fields=countryCode,country,city,isp`),
    httpJSON(`http://ip-api.com/json/${outIP}?fields=countryCode,country,city,isp`)
  ]);

  const content = [
    `IP 風控值：${score}%  ${riskLabel}`,
    ``,
    `IP 類型：${ipType} | ${ipSrc}`,
    ``,
    `入口 IP：${inIP}`,
    `地區：${flag(inGeo.countryCode)} ${inGeo.city} ${inGeo.countryCode}`,
    `運營商：${inGeo.isp}`,
    ``,
    `出口 IP：${outIP}`,
    `地區：${flag(outGeo.countryCode)} ${outGeo.city} ${outGeo.countryCode}`,
    `運營商：${outGeo.isp}`
  ].join("\n");

  done({
    title: `代理策略：${policy}`,
    content,
    icon: "shield.lefthalf.filled",
    "icon-color": color
  });
})();
