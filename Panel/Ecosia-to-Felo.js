const express = require('express');
const axios = require('axios');

const app = express();
const PORT = 3000;

// 攔截 Ecosia 的 autocomplete 請求
app.get('/autocomplete', async (req, res) => {
  try {
    // 1. 向 Ecosia 發送請求
    const ecosiaResponse = await axios.get('https://ac.ecosia.org/autocomplete', {
      params: req.query, // 傳遞用戶的查詢參數
    });

    // 2. 獲取 Ecosia 的回應
    const ecosiaData = ecosiaResponse.data;

    // 3. 向 Felo.ai 發送請求（基於 Ecosia 的回應）
    const feloResponse = await axios.get('https://felo.ai/api/autosuggest', {
      params: { query: req.query.q }, // 這裡可以根據需求調整參數
    });

    // 4. 合併或處理兩者的結果（如果需要）
    const finalResult = {
      ecosia: ecosiaData,
      felo: feloResponse.data,
    };

    // 5. 返回最終結果給用戶
    res.json(finalResult);
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).send('Internal Server Error');
  }
});

// 攔截 Ecosia 的 search 請求
app.get('/search', async (req, res) => {
  try {
    // 1. 向 Ecosia 發送請求
    const ecosiaResponse = await axios.get('https://www.ecosia.org/search', {
      params: req.query, // 傳遞用戶的查詢參數
    });

    // 2. 獲取 Ecosia 的回應
    const ecosiaData = ecosiaResponse.data;

    // 3. 向 Felo.ai 發送請求（基於 Ecosia 的回應）
    const feloResponse = await axios.get('https://felo.ai/search', {
      params: { query: req.query.q }, // 這裡可以根據需求調整參數
    });

    // 4. 合併或處理兩者的結果（如果需要）
    const finalResult = {
      ecosia: ecosiaData,
      felo: feloResponse.data,
    };

    // 5. 返回最終結果給用戶
    res.json(finalResult);
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).send('Internal Server Error');
  }
});

// 啟動伺服器
app.listen(PORT, () => {
  console.log(`Proxy server is running on http://localhost:${PORT}`);
});
