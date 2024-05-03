const express = require('express');
const app = express();
require('dotenv').config();

const { MongoClient } = require('mongodb');
const url = process.env.MONGODB_URI;

let db;
new MongoClient(url)
  .connect()
  .then((client) => {
    db = client.db('forum');
  })
  .catch((err) => console.log(err));

// express static file

// case 1
app.use(express.static('public'));

// case 2
// app.use(express.static(__dirname + '/public'));

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
  db.collection('post').insertOne({ title: 'hello' });
  res.send('good news');
});

app.get('/shop', (req, res) => {
  res.send('happy shopping');
});

app.get('/about', (req, res) => {
  res.sendFile(__dirname + '/about.html');
});
