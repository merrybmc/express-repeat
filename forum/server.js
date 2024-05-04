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
  const { _id, username } = req.user;
  try {
    if (!req.user) throw new Error('로그인중이지 않습니다.');
    if (title === '') {
      res.send('empty in title');
    } else {
      db.collection('post').insertOne({ title, content, userId: _id, username });

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
    let commentList = await db
      .collection('comment')
      .find({ parentId: new ObjectId(id) })
      .toArray();

    if (!result) throw new Error('not found Data');

    res.render('detail.ejs', { data: result, comment: commentList });
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
  const { _id, username } = req.user;
  try {
    const data = await db
      .collection('post')
      .deleteOne({ _id: new ObjectId(id), userId: _id, username: username });
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

// npm install connect-mongo
// session 정보 DB 저장
const MongoStore = require('connect-mongo');

// 순서 지켜서 use할 것
app.use(passport.initialize());
app.use(
  session({
    secret: process.env.SESSION_SECRET, // session의 id를 암호화해서 유저에게 전송
    resave: false, // 클라이언트가 api 요청을 보낼 때 마다 session을 갱신할건지
    saveUninitialized: false, // login을 안해도 session을 생성할건지
    cookie: { maxAge: 60 * 60 * 60 * 1000 }, // 밀리초 단위, 쿠키 유효기간 미입력 시 기본 2주
    store: MongoStore.create({
      // session mongoDB 저장
      mongoUrl: process.env.MONGODB_URI,
      dbName: 'forum',
    }),
  })
);
app.use(passport.session());

// npm install bcrypt
// 비밀번호 암호화
const bcrypt = require('bcrypt');

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

      // if (result.password === password) {
      // bcrypt.compare 암호화된 비밀번호 검증
      // parameter 1 = 유저가 입력한 비밀번호
      // parameter 2 = 암호화된 비밀번호
      if (await bcrypt.compare(password, result.password)) {
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
  res.render('login.ejs');
});

// 로그인
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

app.get('/register', (req, res) => {
  res.render('register.ejs');
});

// 회원가입
app.post('/register', async (req, res) => {
  try {
    const { username, password, passwordCheck } = req.body;

    if (password !== passwordCheck) throw new Error('비밀번호가 일치하지 않습니다.');

    const valid = await db.collection('user').findOne({ username });
    console.log(valid);
    if (valid) throw new Error('이미 존재하는 아이디입니다.');

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const user = await db.collection('user').insertOne({
      username,
      password: hash,
    });

    res.redirect('/login');
  } catch (e) {
    res.status(400).json({ status: 'fail', error: e.message });
  }
});

// middleware
// 미들웨어 함수에선 req, res, next 사용 가능
const userValidCheck = (req, res, next) => {
  if (!req.user) {
    // next() => 다음 middleware 호출
    next();
  }
};

const userRequestAdd = (req, res, next) => {
  // 다음 middleware의 req에 데이터를 담아서 전송
  req.test = 'success';
};

// 모든 API가 호출받을 때마다 자동으로 해당 middleware 호출
app.use(userRequestAdd);

// 해당 route와 일치하는 모든 API가 호출받을 때마다 자동으로 해당 middleware 호출
app.use('/test', userRequestAdd);

// userValidCheck, userRequestAdd, route 함수 순으로 호출
app.get('middlewareTest', userValidCheck, userRequestAdd, (req, res) => {
  console.log(req.test);
  res.send('');
});

// se image upload

// npm install multer multer-s3 @aws-sdk/client-s3

const { S3Client } = require('@aws-sdk/client-s3');
const multer = require('multer');
const multerS3 = require('multer-s3');
const s3 = new S3Client({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.S3_BUCKEY,
    key: function (req, file, cb) {
      cb(null, Date.now().toString()); //파일 업로드시 파일명 설정
    },
  }),
});

// 단일 파일 업로드 middleware 설정
// upload.single(key)
// 다중 파일 업로드
// upload.array(key,number?) number - 파일 개수

// app.post('/add', upload.single("image"), (요청, 응답) => {

// 파일 단일 조회
// req.file
// 파일 다중 조회
// req.files
// 파일 url
// req.file.locaiton

//   console.log(요청.file)
//   await db.collection('post').insertOne({
//     title : 요청.body.title,
//     content : 요청.body.content,
//     img : 요청.file.location
//   })
//   (생략)
// })

// 기본 분리법
// require('./routes/shop');

// middleware 분리
// url 시작부분 축약 가능
// app.use('/shop', require('./routes/shop'));

app.get('/search', async (req, res) => {
  const { val } = req.query;

  const data = db
    .collection('post')
    // $regex 정규식 : value - 해당 문자가 포함된 데이터 모두 찾기 (=.includes)
    .find({ title: { $regex: val } })
    .toArray();

  res.render('search.ejs', { data });
});

app.post('/comment', async (req, res) => {
  // const { comment, parentId } = req.body;
  // const { _id, username } = req.user;
  console.log(req.user);
  // const data = await db.collection('comment').insertOne({
  //   content: comment,
  //   writerId: _id,
  //   writername: username,
  //   parentId,
  // });

  res.redirect('back');
});
