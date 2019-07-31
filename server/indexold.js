const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const db = require("../database/index.js");
const DB_MYSQL = require("../database/sql-index.js")
const middleware = require("./middleware.js");
const helpers = require("./helpers.js");
const faker = require('faker');

const PORT = 3000;

const app = express();

app.use(express.urlencoded({extended: true})); 
app.use(express.json()); 
app.use(cookieParser());
app.use(cors(middleware.corsOptions));


app.use(express.static("dist"));

app.get("/seedDaDB", (req, res) => {
  let count = 0;
  let data = {};
  let x = 1;
  let y = 11467;
  let interval = 11467;

  function resolveAfter2Seconds(start, end) {
    return new Promise(resolve => {
      setTimeout(() => {
        for(i=start; i<=end; i++){
          let alt = faker.commerce.productName(); //same as name
          let src = faker.image.avatar();  //also name of obj as string ex: "0"{"alt": "name of product"}
          let category = faker.commerce.product();
          let subCategory = faker.commerce.department();
          data[i] = {"alt": alt, "src": src, "id": i, "category": category, "subCategory": subCategory, "name": alt}
        }
        resolve(data);
      }, 2000);
    });
  }
  async function asyncCall(start, end) {
    console.log(count);
    var result = await resolveAfter2Seconds(start, end);
    result;
  //   console.log(result);
    const Push = await queryTest(data);
    Push;
    data = {};
    count ++;
  //   console.log(count);
    if(count !== 2){
      beg = x + (count * interval);
      end = beg + interval - 1;
      console.log(beg, end);
      asyncCall(beg, end);
    }
    // expected output: 'resolved'
  }
  async function queryTest(data){ //will have DB in it 
      // console.log(data, "should be coming in chunks"); 
    DB_MYSQL.insertData(data, (err, res) => {
      if (err) {console.log('INSERTION ERROR FROM SERVER',err)}
    })  
  }
  if(count === 0){
    asyncCall(x, y);
  }
  res.send("done");
})

// DB_MYSQL.schema();
// DB_MYSQL.usersSchema();
// DB_MYSQL.userHistorySchema();

app.post("/users", middleware.itemLookup, async (req, res) => {
  try {
    const item = req.body.item;
    let sessionId = req.cookies.user_session;
    if (!req.cookies.user_session) {
      sessionId = helpers.randomStringifiedNumberOfLength(32);
      await db.createUser(sessionId);
      res.cookie("user_session", sessionId);
    }
    const user = await db.getUser(sessionId);
    await db.recordView(user.id, item.id);
    res.status(201);
  } catch (err) {
    console.log("duplicate userHist insertion attempted, probably");
  } finally {
    res.send();
  }
});

app.get("/carousels", middleware.itemLookup, async (req, res) => {
  const item = req.body.item;
  const carousels = {};

  carousels.related = await db.selectRelated(item);
  const sameCategory = await db.selectSameCategory(item);
  const alsoViewedFiller = await db.getAlsoViewedFiller(item.id);
  carousels.alsoViewed = helpers.concatOnlyUnique(
    sameCategory,
    alsoViewedFiller
  );
  carousels.prevViewed = await db.getUserHistory(
    req.cookies.user_session,
    item.id
  );

  res.send(carousels);
});

app.listen(PORT, () => {
  console.log(`whats up, server's on ${PORT}, baby`);
});
