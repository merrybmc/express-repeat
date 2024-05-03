// express module load
const express = require('express');
const app = express(); // express 함수 호출
const bodyParser = require('body-parser');

const fs = require('fs');
const template = require('./lib/template.js');
const path = require('path');

// body-parser
// routing 함수가 실행되기 전에 이 코드가 미들웨어로 들어오게 된다.
// 클라이언트에서 api를 요청할 때마다 request의 첫번째 인자에 body property를 만들어준다.

// formData 처리
app.use(bodyParser, bodyParser.urlencoded({ extended: false }));
// json 타입 요청 처리
app.use(bodyParser, json());

// routing

// method = http method
// parameter 1 = url path
// parameter 2 = 경로가 호출되었을 때 request, response

// 축약된 최신 코드
app.get('/', (request, response) =>
  // fs.readdir = data directory에 있는 파일들을 가져옴
  fs.readdir('./data', function (error, filelist) {
    var title = 'Welcome';
    var description = 'Hello, Node.js';
    var list = template.list(filelist);
    var html = template.HTML(
      title,
      list,
      `<h2>${title}</h2>${description}`,
      `<a href="/create">create</a>`
    );
    response.send(html);
  })
);

// 과거 코드
// app.get('/yet', function (req, res) {
//   return res.send('Hello World');
// });

// dynamic routing params
app.get('/page/:pageId', (req, res) => {
  // url params 값 받아오기
  const { params } = req;

  fs.readdir('./data', function (error, filelist) {
    var filteredId = path.parse(params).base;
    fs.readFile(`data/${filteredId}`, 'utf8', function (err, description) {
      var title = queryData.id;
      var sanitizedTitle = sanitizeHtml(title);
      var sanitizedDescription = sanitizeHtml(description, {
        allowedTags: ['h1'],
      });
      var list = template.list(filelist);
      var html = template.HTML(
        sanitizedTitle,
        list,
        `<h2>${sanitizedTitle}</h2>${sanitizedDescription}`,
        ` <a href="/create">create</a>
                    <a href="/update?id=${sanitizedTitle}">update</a>
                    <form action="delete_process" method="post">
                      <input type="hidden" name="id" value="${sanitizedTitle}">
                      <input type="submit" value="delete">
                    </form>`
      );
      res.send(html);
    });
  });
});

app.get('/create', (req, res) => {
  fs.readdir('./data', function (error, filelist) {
    var title = 'WEB - create';
    var list = template.list(filelist);
    var html = template.HTML(
      title,
      list,
      `
            <form action="/create_process" method="post">
              <p><input type="text" name="title" placeholder="title"></p>
              <p>
                <textarea name="description" placeholder="description"></textarea>
              </p>
              <p>
                <input type="submit">
              </p>
            </form>
          `,
      ''
    );
    res.status(200).send(html);
  });
});

app.post('/create_process', (req, res) => {
  var post = req.body; // body-parser
  var title = post.title;
  var description = post.description;
  fs.writeFile(`data/${title}`, description, 'utf8', function (err) {
    res.writeHead(302, { Location: `/?id=${title}` });
    res.end();
  });
});

// body에 request로 온 데이터가 도착할 때 마다
// body의 끝에다가 일일이 추가해오던 방식
// var body = '';

// req.on('data', function (data) {
//   body = body + data;
// });
// req.on('end', function () {
// var post = qs.parse(body);
// var title = post.title;
// var description = post.description;
// fs.writeFile(`data/${title}`, description, 'utf8', function (err) {
//   res.writeHead(302, { Location: `/?id=${title}` });
//   res.end();
// });
// });
// });

app.get('/update', (req, res) => {
  fs.readdir('./data', function (error, filelist) {
    var filteredId = path.parse(queryData.id).base;
    fs.readFile(`data/${filteredId}`, 'utf8', function (err, description) {
      var title = queryData.id;
      var list = template.list(filelist);
      var html = template.HTML(
        title,
        list,
        `
              <form action="/update_process" method="post">
                <input type="hidden" name="id" value="${title}">
                <p><input type="text" name="title" placeholder="title" value="${title}"></p>
                <p>
                  <textarea name="description" placeholder="description">${description}</textarea>
                </p>
                <p>
                  <input type="submit">
                </p>
              </form>
              `,
        `<a href="/create">create</a> <a href="/update?id=${title}">update</a>`
      );
      res.status(200).send(html);
    });
  });
});

app.post('/update_process', (req, res) => {
  var post = req.body;
  var id = post.id;
  var title = post.title;
  var description = post.description;
  fs.rename(`data/${id}`, `data/${title}`, function (error) {
    fs.writeFile(`data/${title}`, description, 'utf8', function (err) {
      res.writeHead(302, { Location: `/?id=${title}` });
      res.end();
      res.redirect(`/?id=${title}`);
    });
  });
});

app.post('/delete_process', (req, res) => {
  var post = req.body;
  var id = post.id;
  var filteredId = path.parse(id).base;
  fs.unlink(`data/${filteredId}`, function (error) {
    res.redirect('/');
  });
});

// parameter 1 = connect port number
// 최신 코드
app.listen(3000, () => console.log('port 3000 connected'));

// 과거 코드
app.listen(3000, function () {
  return console.log('port 3000 connected');
});
