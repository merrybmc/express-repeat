const express = require('express');
const app = express();
require('dotenv').config();

// ejs (template engine)

// ejs setting
// html 파일안에 서버 데이터를 넣을 수 있다.
app.set('view engine', 'ejs');

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

// mongodb create
app.get('/news', (req, res) => {
  db.collection('post').insertOne({ title: 'hello' });
  res.send('good news');
});

// mongodb read
app.get('/list', async (req, res) => {
  const post = await db.collection('post').find().toArray();

  // res.send(post);
  // ejs 파일 기본 경로 = views 폴더
  // ejs 파일로 데이터를 전송
  res.render('list.ejs', { data: post });
});

app.get('/about', (req, res) => {
  res.sendFile(__dirname + '/about.html');
});

app.get('/time', (req, res) => {
  const date = new Date();

  res.render('date.ejs', { data: date });
});
