//程式碼出處 https://raw.githubusercontent.com/easydyp/Surge/main/functionstatus.js
!(async () => {
let traffic = (await httpAPI("/v1/traffic","GET"));
let dateNow = new Date();
let dateTime = Math.floor(traffic.startTime*1000);
let startTime = timeTransform(dateNow,dateTime);
let mitm_status = (await httpAPI("/v1/features/mitm","GET"));
let rewrite_status = (await httpAPI("/v1/features/rewrite","GET"));
let scripting_status = (await httpAPI("/v1/features/scripting","GET"));
let icon_s = mitm_status.enabled&&rewrite_status.enabled&&scripting_status.enabled;
//按下按鈕，更新 dns
//if ($trigger == "button") await httpAPI("/v1/dns/flush");
//按下按鈕，重讀配置（同時更新 dns）
if ($trigger == "button") {
	await httpAPI("/v1/profiles/reload");
	$notification.post("配置重讀","配置重讀成功","")

//授權日為手動輸入
};
$done({
    title:"𝗦𝗨𝗥𝗚𝗘ᴾᴿᴼ 授權到期日：2022-08-21 \n開關已啟動"+startTime,
    content:"Mitm:"+icon_status(mitm_status.enabled)+"  Rewrite:"+icon_status(rewrite_status.enabled)+"  Scripting:"+icon_status(scripting_status.enabled),
    icon: icon_s?"checkmark.seal":"exclamationmark.triangle",
   "icon-color":icon_s?"#16A951":"#FF7500"
});
})();
function icon_status(status){
  if (status){
    return "\u2611";
  } else {
      return "\u2612"
    }
}
function timeTransform(dateNow,dateTime) {
let dateDiff = dateNow - dateTime;
let days = Math.floor(dateDiff / (24 * 3600 * 1000));//計算出相差天数
let leave1=dateDiff%(24*3600*1000)    //計算天數後剩餘的毫秒数
let hours=Math.floor(leave1/(3600*1000))//計算出小時數
//計算相差分鐘數
let leave2=leave1%(3600*1000)    //計算小時數後剩餘的毫秒數
let minutes=Math.floor(leave2/(60*1000))//計算相差分鐘數
//計算相差秒數
let leave3=leave2%(60*1000)      //計算分鐘數後剩餘的毫秒數
let seconds=Math.round(leave3/1000)

if(days==0){
  if(hours==0){
    if(minutes==0)return(`${seconds}秒`);
      return(`${minutes}分${seconds}秒`)
    }
    return(`${hours}時${minutes}分${seconds}秒`)
  }else {
        return(`${days}天${hours}時${minutes}分`)
	}
}
function httpAPI(path = "", method = "POST", body = null) {
  return new Promise((resolve) => {
    $httpAPI(method, path, body, (result) => {
      resolve(result);
    });
  });
}
