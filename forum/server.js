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

app.get('/list/:page', async (req, res) => {
  const { page } = req.params;

  // skip 앞에서부터 입력된 값만큼 데이터를 스킵
  // limit 보여줄 데이터의 개수
  const post = await db
    .collection('post')
    .find()
    .skip((page - 1) * 5)
    .limit(5)
    .toArray();

  // url = get("/list/next/:id")
  // id 에는 읽어온 게시글 중 마지막 게시글의 id를 param으로 요청
  const { id } = req.params;
  let recent = await db
    .collection('post')
    // 방금 마지막으로 본 게시물 기준으로 게시글 읽어오기
    .find({ _id: { $gt: new ObjectId(id) } })
    .limit(5)
    .toArray();
  console.log(post);
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

// npm install express-session passport passport-local
// express-session - session create
// passport - user auth
// passport-local - ID/PW vaild

// passport setting
const session = require('express-session');
const passport = require('passport');
const localStrategy = require('passport-local');

// 순서 지켜서 use할 것
app.use(passport.initialize());
app.use(
  session({
    secret: process.env.SESSION_SECRET, // session의 id를 암호화해서 유저에게 전송
    resave: false, // 클라이언트가 api 요청을 보낼 때 마다 session을 갱신할건지
    saveUninitialized: false, // login을 안해도 session을 생성할건지
    cookie: { maxAge: 60 * 60 * 60 * 1000 }, // 밀리초 단위, 쿠키 유효기간 미입력 시 기본 2주
  })
);
app.use(passport.session());

// passport id/pw 검증 로직
// id/pw 외에도 요청받아서 검증하고 싶으면 passReqToCallback option 사용
passport.use(
  new localStrategy(async (username, password, cb) => {
    try {
      let result = await db.collection('user').findOne({ username });

      if (!result) {
        // parameter 2 = true - 인증 성공(생략 가능), false - 회원인증 실패
        return cb(null, false, { message: '등록되지 않은 아이디 입니다.' });
      }
      if (result.password === password) {
        // 로그인에 성공하면 result에 유저의 정보를 담아서 반환
        return cb(null, result);
      } else {
        return cb(null, false, { message: '비밀번호가 일치하지 않습니다.' });
      }
    } catch (e) {}
  })
);

// 로그인 시 세션 만들기
// passport.authenticate에서 response.logn()을 할 경우 자동 호출됨
// user = 로그인 시도중인 user의 DB에 담긴 개인정보
passport.serializeUser((user, done) => {
  // process.nextTick = 내부 코드를 비동기로 처리해줌
  process.nextTick(() => {
    // 유저의 정보를 담아서 session 발행, password는 미입력
    // cookie에 담아서 전송

    done(null, { id: user._id, username: user.username });
  });
});

// 클라이언트가 요청한 cookie 검증
// 클라이언트가 api 요청을 할 때 마다 cookie도 함께 전송됨
// 해당 함수를 만들어두고 request.user를 하면 cookie 검증하고 회원정보 반환
passport.deserializeUser(async (user, done) => {
  // session의 user가 오래된 정보인지 검증
  let result = await db.collection('user').findOne({ _id: new ObjectId(user.id) });
  delete result.password;

  process.nextTick(() => {
    // 쿠키 검증이 되면 로그인된 유저 정보 반환
    done(null, result);
  });
});

app.get('/login', async (req, res) => {
  console.log(req.user);
  res.render('login.ejs');
});

app.post('/login', async (req, res, next) => {
  // passport.authentiate = passport id/pw 검증 로직 실행
  // 검증에 실패하면 error 반환받음
  // 검증에 성공하면 user 반환받음
  // 반환 상태에 대해 info 반환받음
  // => { 다음에 실행될 코드 }
  passport.authenticate('local', (error, user, info) => {
    if (error) res.status(400).json({ status: 'fail', error });
    if (!user) res.status(401).json({ status: 'fail', error: info.message });
    req.login(user, (error) => {
      if (error) return next(error);
      res.redirect('/');
      // res.status(200).json({ status: 'success', user });
    });
  })(req, res, next);
});

app.get('/mypage', async (req, res) => {
  console.log(req.user);
  try {
    if (!req.user) throw new Error('login please');

    res.render('mypage.ejs', { data: req.user });
  } catch (e) {
    res.redirect('/');
  }
});
