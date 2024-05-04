const express = require('express');
const app = express();
require('dotenv').config();
const bodyparser = require('body-parser');
const methodOverride = require('method-override');

// ejs (template engine)

// ejs setting
// html 파일안에 서버 데이터를 넣을 수 있다.
app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// html form 태그에서 put, delete 요청이 가능하도록 도와주는 라이브러리
app.use(methodOverride('_method'));

const { MongoClient, ObjectId } = require('mongodb');
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

app.get('/write', (req, res) => {
  res.render('write.ejs');
});

app.post('/add', (req, res) => {
  const { title, content } = req.body;
  try {
    if (title === '') {
      res.send('empty in title');
    } else {
      db.collection('post').insertOne({ title, content });

      res.redirect('/list');
      // res.status(200).json({ status: 'success' });
    }
  } catch (e) {
    res.status(400).send({ status: 'fail' });
  }
});

app.get('/detail/:id', async (req, res) => {
  const { id } = req.params;

  try {
    if (!id) throw new Error('not found Id');

    let result = await db.collection('post').findOne({ _id: new ObjectId(id) });

    if (!result) throw new Error('not found Data');

    res.render('detail.ejs', { data: result });
  } catch (e) {
    res.status(400).json({ status: 'fail', error: e.massage });
  }
});

app.get('/edit/:id', async (req, res) => {
  const { id } = req.params;
  console.log(id);
  try {
    if (!id) throw new Error('not found Id');
    const data = await db.collection('post').findOne({ _id: new ObjectId(id) });

    console.log(data);

    if (!data) throw new Error('not found Data');
    res.render('edit.ejs', { data });
  } catch (e) {
    res.status(400).json({ status: 'fail', error: e.massage });
  }
});

app.put('/edit/:id', async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;
  try {
    const data = await db
      .collection('post')
      .updateOne({ _id: new ObjectId(id) }, { $set: { title, content } });

    res.status(200).json({ status: 'success', data });
  } catch (e) {
    res.status(400).json({ status: 'fail', error: e.massage });
  }
});

app.delete('/delete/:id', async (req, res) => {
  const { id } = req.params;
  console.log(id);
  try {
    const data = await db.collection('post').deleteOne({ _id: new ObjectId(id) });
    console.log('a', data);
    res.status(200).json({ status: 'success', data });
  } catch (e) {
    res.status(400).json({ status: 'fail', error: e.massage });
  }
});
