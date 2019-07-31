const mysql  = require('mysql');
const CONFIG = require("../config/db.config.mysql.json")
const knex   = require('knex') (CONFIG);

console.log('yo dawg, DB here')


// SCHEMA BUILDING & SETUP

const imagesSchema = () => {
  knex.schema.createTable('images', (table) => {
    table.integer('id').primary();
    table.string('name');
    table.string('src');
    table.string('alt');
    table.string ('category');
    table.string('subCategory');
  })
  .then(console.log('test'));
};

const usersSchema = () => {
  knex.schema.createTable('users', table => {
    table.increments('id').primary();
    table.string('session', 64).nullable();
  })
  .then(console.log('users schema built into DB!'))
  .catch( error => {console.log('cant build the users schema!\n', error)})
}

const userHistorySchema = () => {
  knex.schema.createTable('userhistory', table => {
    table.increments('id').primary();
    table.integer('userid').nullable();
    table.integer('imageid').nullable();
    
    // add foreign keys:
    table.foreign('userid').references('users.id');
    table.foreign('imageid').references('images.id');
  })
  .then(console.log('userhistory schema built into DB!'))
  .catch( error => {console.log('cant build the userhistory schema!\n', error)})
}

const insertData = (generated, cb) => {
  // console.log(generated);
  for (let id in generated) {
    const insertion = {
      id          :  Number(id),
      name        : `"${generated[id].name}"`,
      src         : `"${generated[id].src}"` ,
      alt         : `"${generated[id].alt}"` ,
      category    : `"${generated[id].category}"`,
      subCategory : `"${generated[id].subCategory}"`
    }
    knex('images').insert(insertion)
    .then( res => null ) // Need a .then to initiate the knex func
    .catch( err => console.log(err) )
  };
  setTimeout(() => {
    cb(null); //will ony run once after first set is in db
  }, 18000)
};


// MAIN DATABASE METHODS

const selectAll = (cb) => {
  knex.select().from('images')
  .then( result => {
    cb(null, result)
  })
  .catch( error => {
    console.log('knex error: ', error);
    cb(error)
  });
};

const selectOneById = (itemId) => {
  return (
    knex('images')
      .where({id : itemId})
  );
};

const selectOneByName = (itemName, cb) => {
  knex('images')
    .where({
      name : itemName
    })
    .then( result => {
      console.log('knex query result: ', result);
      cb(null, result)
    })
    .catch( error => {
      console.log('knex error: ', error);
      cb(error)
    });
};

const selectRelated = (item) => {
  console.log('db.selectRelated recieved this item from server: ', item);
  return (
    knex('images')
      .where(knex.raw(`category = '${item.category}'`))
      .where(knex.raw(`name != '${item.name}'`))
      .where(knex.raw(`subCategory != '${item.subCategory}'`))
      .select('id', 'name', 'src', 'alt')
      .limit(15)
  );
};

const selectSameCategory = async (item) => {
  console.log('db.selectSameCategory recieved this item from server: ', item);

  return (
    knex('images')
      .where(knex.raw(`name = '${item.name}'`))
      .where(knex.raw(`subCategory != '${item.subCategory}'`))
      .select('id', 'name', 'src', 'alt')
  );
};

const createUser = (userSesh) => {
  knex('users').insert({session: userSesh})
  .then( result => {
    console.log('knex createUser query result: ', result);
    return result;
  })
  .catch( error => {
    console.log('knex createUser error: ', error);
  });
};

const getUser = (userSesh) => {
  return ( 
    knex('users').where( {session : userSesh} )
  );
};

const recordView = (userId, itemId, cb) => {
  console.log('db.recordView recieved this item from server: ', itemId)
  knex('userHistory').insert({
    userid : userId,
    imageid : itemId
  })
  .then( result => {
    console.log('knex recordView query result: ', result);
    return result;
  })
  .catch( error => {
    console.log('knex recordView error: ', error);
  });
};

const getUserHistory = (userSesh, itemId) => {
  console.log('db.getUesrHistory recieved this sesh and item from server: ', userSesh, itemId);
  return knex.raw(`
  SELECT
    images.id,
    images.name,
    images.src,
    images.alt
  FROM
    images,
    userHistory,
    users
  WHERE
    images.id = userHistory.imageid
    AND users.id = userHistory.userid
    AND users.session = 78377640453801846575423308121131
    AND images.id != 11
  ORDER BY
    userhistory.id DESC
  `)

  // knex(knex.raw('images, userHistory, users')) // from tables in ...args
  //   .orderBy('userHistory.id', 'desc')
  //   .whereNot({'images.id' : itemId})
  //   .where({
  //     'images.id'     : userHistory.imageid,
  //     'users.id'      : userHistory.userid,
  //     'users.session' : userSesh,
  //   })
  //   .select('images.id', 'images.name', 'images.src', 'images.alt')
    // .then( result => {
    //   console.log('knex getUserHistory query result: ', result);
    //   return result;
    // })
    // .catch( error => {
    //   console.log('knex getUserHistory error: ', error);
    // })
}


const getAlsoViewedFiller = (itemId) => {
  console.log('db.getAlsoViewedFiller recieved this itemid from server: ', itemId);
  // return knex(knex.raw('images', 'userHistory', 'users'))
  //   .where( {'images.id' : userHistory.imageid} )
  //   .where(knex.raw('images.id = userHistory.imageid'))
  //   .where(knex.raw('users.id = userHistory.userid'))
  //   .where(knex.raw(`images.id != ${itemId}`))
  //   .limit(15)
  //   .orderByRaw('rand() <0.15 dsafsadffad')
  //   .distinct('images.id', 'images.name', 'images.src', 'images.alt')
  return knex.raw(`
    SELECT DISTINCT
      images.id,
      images.name,
      images.src,
      images.alt
    FROM
      images,
      userHistory,
      users
    WHERE
      images.id = userHistory.imageid
      AND users.id = userHistory.userid
      AND images.id != ${itemId}
    ORDER BY
      rand() < 0.15
    LIMIT 15;
  `)
}

module.exports = { 
  imagesSchema, 
  usersSchema,
  userHistorySchema,
  insertData,
  selectOneById,
  selectOneByName,
  selectRelated,
  selectSameCategory,
  getAlsoViewedFiller,
  createUser,
  getUser,
  getUserHistory,
  recordView 
};