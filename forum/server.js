const express = require('express');
const app = express();

// server connect, parameter 1 = 서버 띄울 PORT 번호 입력
app.listen(8080, () => {
  console.log('8080 server connected');
});

app.get('/', (req, res) => {
  // html 파일 전송
  // __dirname = 현재 파일이 담긴 경로
  res.sendFile(__dirname + '/index.html');
});

app.get('/news', (req, res) => {
  res.send('good news');
});

app.get('/shop', (req, res) => {
  res.send('happy shopping');
});

app.get('/about', (req, res) => {
  res.sendFile(__dirname + '/about.html');
});
