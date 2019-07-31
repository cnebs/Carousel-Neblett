const db = require("../database/sql-index.js");

const whitelist = [
  "http://fec-proxy.us-east-1.elasticbeanstalk.com",
  "http://fec-lowes-proxy.us-east-2.elasticbeanstalk.com",
  "http://lowesproxy-env.6tim4uzsty.us-east-2.elasticbeanstalk.com",
  "http://fec-lowes-carousel.us-east-2.elasticbeanstalk.com",
  "http://ec2-18-188-213-241.us-east-2.compute.amazonaws.com",
  "http://ec2-18-225-6-113.us-east-2.compute.amazonaws.com",
  "http://lowesproductoverview-env.mk2qecy2ne.us-east-2.elasticbeanstalk.com",
  "http://localhost:3000",
  "http://localhost:3050"
];

const corsOptions = {
  credentials: true,
  origin: function(origin, callback) {
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  }
};

const itemLookup = async (req, res, next) => {
  let id;
  let regex = /[\/:. ]+/g;
  if (req.method === 'POST') {
     id = req.body.itemId.replace(regex, '');
  } else if (req.method === 'GET') {
    id = req.query.id.replace(regex, '');
  }

  console.log('middleware req.body pre-func: ', req.body);

  await db.selectOneById(id).then( result => {
    console.log('knex selectOneById query result: ', result);
    req.body.item = result;
  })
  .catch( error => {
    console.log('knex selectOneById error: ', error);
  });

  console.log('middleware req.body.item post-func: ', req.body.item);

  next();
};


module.exports = { itemLookup, corsOptions };
