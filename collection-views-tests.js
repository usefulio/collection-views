// findOne() should only return documents which match both queries
Tinytest.add('CollectionViews - findOne - t1', function (test) {
  var Books = newCollection();
  var doc = Books.where({ kind: 'book' }).findOne({ genre: 'fiction' });
  test.matches(doc.title, /Fiction Book/);
});

Tinytest.add('CollectionViews - findOne - t2', function (test) {
  var Books = newCollection();
  var doc = Books.where({ genre: 'science' }).findOne({ kind: 'magazine' });
  test.equal(doc.title, 'Science Magazine 1');
});

// find() should only return documents which match both queries
Tinytest.add('CollectionViews - find - t1', function (test) {
  var Books = newCollection();
  var docs = Books.where({ kind: 'book' }).find({ genre: 'fiction' }).fetch();
  test.equal(_.pluck(docs, 'title'), ['Fiction Book 1', 'Fiction Book 2'])
  test.length(docs, 2);
});

Tinytest.add('CollectionViews - find - t2', function (test) {
  var Books = newCollection();
  var docs = Books.where({ genre: 'science' }).find({}).fetch();
  test.equal(_.pluck(docs, 'title'), ['Science Book 1', 'Science Magazine 1'])
  test.length(docs, 2);
});

Tinytest.add('CollectionViews - find - t3 (query can be a function)', function (test) {
  var Books = newCollection();
  var docs = Books.where(function () {
    return { kind: 'book' }
  }).find({ genre: 'fiction' }).fetch();
  test.equal(_.pluck(docs, 'title'), ['Fiction Book 1', 'Fiction Book 2'])
  test.length(docs, 2);
});

Tinytest.add('CollectionViews - find - t4 (chaining 2 where methods)', function (test) {
  var Books = newCollection();
  var docs = Books
    .where({ kind: 'book' })
    .where({ genre: 'fiction' })
    .find({})
    .fetch();
  test.equal(_.pluck(docs, 'title'), ['Fiction Book 1', 'Fiction Book 2'])
  test.length(docs, 2);
});

Tinytest.add('CollectionViews - find - t5 (chaining 3 where methods)', function (test) {
  var Books = newCollection();
  var docs = Books
    .where({ kind: 'leaflet' })
    .where({ genre: 'cooking' })
    .where({ year: 1999 })
    .find({})
    .fetch();
  test.equal(_.pluck(docs, 'title'), ['Chainable 2']);
  test.length(docs, 1);
});

Tinytest.add('CollectionViews - find - t6 (chaining 2 where methods with find query)', function (test) {
  var Books = newCollection();
  var docs = Books
    .where({ kind: 'leaflet' })
    .where({ year: 1999 })
    .find({ genre: 'advertising' })
    .fetch();
  test.equal(_.pluck(docs, 'title'), ['Chainable 1']);
  test.length(docs, 1);
});

// update() should only affect documents which match both queries
Tinytest.add('CollectionViews - update - t1', function (test) {
  var Books = newCollection();
  var affectedCount = Books.where({ kind: 'book' }).update({}, 
    { $set: { catalogId: 1 } }
    , { multi: true }
  );
  test.equal(affectedCount, 3);
});

Tinytest.add('CollectionViews - update - t2', function (test) {
  var Books = newCollection();
  var affectedCount = Books.where({ genre: 'fiction' }).update({ kind: 'book' }, 
    { $set: { catalogId: 1 } }
    , { multi: true }
  );
  test.equal(affectedCount, 2);
});

Tinytest.add('CollectionViews - update - t3', function (test) {
  var Books = newCollection();
  var docs = Books.where({ genre: 'science', kind: 'magazine' }).find({}).fetch();
  test.length(docs, 1);

  var affectedCount = Books.where({ genre: 'science' }).update({}, 
    { $set: { kind: 'book' } }
    , { multi: true }
  );
  test.equal(affectedCount, 2);

  var docs = Books.where({ genre: 'science', kind: 'magazine' }).find({}).fetch();
  test.length(docs, 0);
});

Tinytest.add('CollectionViews - update - t4 (chaining where methods)', function (test) {
  var Books = newCollection();
  var docs = Books
    .where({ genre: 'science' })
    .where({ kind: 'magazine' })
    .find({})
    .fetch();
  test.length(docs, 1);

  var affectedCount = Books.where({ genre: 'science' }).update({}, 
    { $set: { kind: 'magazine' } }
    , { multi: true }
  );
  test.equal(affectedCount, 2);

  var docs = Books
    .where({ genre: 'science' })
    .find({ kind: 'magazine' })
    .fetch();
  test.length(docs, 2);
});

Tinytest.add('CollectionViews - update - t5 (lazy resolving when argument is function)', function (test) {
  var Books = newCollection();
  var docs = Books
    .where({ genre: 'science' })
    .where({ kind: 'magazine' })
    .find({})
    .fetch();
  test.length(docs, 1);

  var expected;
  var narrowedCollection = Books.where(function () {
    return {genre: expected}
  });
  test.equal(narrowedCollection.find().count(), 0);
  expected = 'science';
  test.equal(narrowedCollection.find().count(), 2);

  var affectedCount = narrowedCollection.update({}, 
    { $set: { kind: 'magazine' } }
    , { multi: true }
  );
  test.equal(affectedCount, 2);

  var docs = Books
    .where({ genre: 'science' })
    .find({ kind: 'magazine' })
    .fetch();
  test.length(docs, 2);
});

// remove() should only affect documents which match both queries
Tinytest.add('CollectionViews - remove - t1', function (test) {
  var Books = newCollection();
  var docs = Books.where({ genre: 'removable' }).find({}).fetch();
  test.length(docs, 4);

  var affectedCount = Books.where({ kind: 'kind2' }).remove({ genre: 'removable' });
  test.equal(affectedCount, 2);

  var docs = Books.where({ genre: 'removable' }).find({}).fetch();
  test.length(docs, 2);
});

Tinytest.add('CollectionViews - remove - t2 (chaining where methods)', function (test) {
  var Books = newCollection();
  var docs = Books.where({ genre: 'cooking' }).find({}).fetch();
  test.length(docs, 3);

  var affectedCount = Books
    .where({ kind: 'tome' })
    .where({ genre: 'cooking' })
    .where({ year: 2000 })
    .remove({});
  test.equal(affectedCount, 1);

  var docs = Books.where({ genre: 'cooking' }).find({}).fetch();
  test.length(docs, 2);
});

Tinytest.add('CollectionViews - remove - t3 (lazy resolving when argument is function)', function (test) {
  var Books = newCollection();
  var docs = Books.where({ genre: 'cooking' }).find({}).fetch();
  test.length(docs, 3);

  var affectedCount = Books
    .where(function () {
      var query = {
        kind: 'tome'
      };
      _.extend(query, { genre: 'cooking' });
      query.year = 1999;
      return query;
    })
    .remove({});
  test.equal(affectedCount, 1);

  var docs = Books.where({ genre: 'cooking' }).find({}).fetch();
  test.length(docs, 2);
});

// upsert() should only affect documents which match both queries
Tinytest.add('CollectionViews - upsert - t1', function (test) {
  var Books = newCollection();
  var result = Books.where({ kind: 'magazine' }).upsert({}, 
    { $set: { catalogId: 1 } }
    , { multi: true }
  );
  test.equal(result.numberAffected, 2);
});

Tinytest.add('CollectionViews - upsert - t2 (chainable where methods)', function (test) {
  var Books = newCollection();
  var result = Books
    .where({ kind: 'book' })
    .where({ genre: 'fiction' })
    .upsert({}, 
      { $set: { catalogId: 1 } }
      , { multi: true }
    );
  test.equal(result.numberAffected, 2);
});

Tinytest.add('CollectionViews - upsert - t3 (lazy resolving when argument is function)', function (test) {
  var Books = newCollection();
  var result = Books
    .where(function () {
      return {
        kind: 'book'
        , genre: 'science'
      }
    })
    .upsert({}, 
      { $set: { catalogId: 1 } }
      , { multi: true }
    );
  test.equal(result.numberAffected, 1);
});

Tinytest.add('CollectionViews - upsert - t4 (no matches found, insert still works)', function (test) {
  var Books = newCollection();
  var result = Books
    .where({ kind: 'impossible' })
    .upsert({}, 
      { $set: { catalogId: 1 } }
      , { multi: true }
    );
  test.equal(result.numberAffected, 1);
  test.isNotUndefined(result.insertedId);
  test.isNotNull(result.insertedId);
  test.isNotNull(result.insertedId);
  test.equal(typeof result.insertedId, 'string');
});

Tinytest.add('CollectionViews - field specifier - narrows the set of fields returned by a query', function (test) {
  var books = newCollection();
  var result = books.where({}, {
    fields: {
      catalogId: 0
    }
  }).findOne();
  test.isUndefined(result.catalogId,
    'findOne returns an object without the excluded catalogId');
  test.equal(result, _.omit(books.findOne(result._id), 'catalogId'),
    "findOne returns an object which otherwise matches the original object");

  result = books.where({}, {
    fields: {
      catalogId: 0
      , genre: 0
    }
  }).findOne();
  test.isUndefined(result.catalogId,
    'findOne returns an object without the excluded catalogId');
  test.isUndefined(result.genre,
    'findOne returns an object without the excluded genre');
  test.equal(result, _.omit(books.findOne(result._id), 'catalogId', 'genre'),
    "findOne returns an object which otherwise matches the original object");

  result = books.where({}, {
    fields: {
      catalogId: 1
      , genre: 1
    }
  }).findOne();
  test.isNotUndefined(result.catalogId,
    'findOne returns an object with the included catalogId');
  test.isNotUndefined(result.genre,
    'findOne returns an object with the included genre');
  test.equal(result, _.pick(books.findOne(result._id), '_id', 'catalogId', 'genre'),
    "findOne returns an object which includes only the included fields");

  result = books.where({}, {
    fields: {
      catalogId: 0
      , genre: 1
    }
  }).findOne();
  test.isUndefined(result.catalogId,
    'findOne returns an object without the excluded catalogId');
  test.isNotUndefined(result.genre,
    'findOne returns an object with the included genre');
  test.equal(result, _.pick(books.findOne(result._id), '_id', 'genre'),
    "findOne returns an object with only the included field");
});

Tinytest.add('CollectionViews - field specifier - find and findOne field specifiers are narrowed', function (test) {
  var books = newCollection();
  var result = books.where({}, {
    fields: {
      catalogId: 0
    }
  }).findOne({}, {
    fields: {
      genre: 0
    }
  });
  test.isUndefined(result.catalogId,
    'findOne returns an object without the excluded catalogId');
  test.isUndefined(result.genre,
    'findOne returns an object without the excluded genre');
  test.equal(result, _.omit(books.findOne(result._id), 'catalogId', 'genre'),
    "findOne returns an object which otherwise matches the original object");

  result = books.where({}, {
    fields: {
      catalogId: 0
    }
  }).find({}, {
    fields: {
      genre: 0
    }
  }).fetch();
  test.equal(result, books.find({}, { fields: {
    genre: 0
    , catalogId: 0
  }}).fetch(),
    "narrowed find results are identical to a call to find with equivilent field specifier");

  result = books.where({}, {
    fields: {
      catalogId: 1
    }
  }).findOne({}, {
    fields: {
      genre: 1
    }
  });
  test.isUndefined(result.catalogId,
    'findOne returns an object without the included catalogId');
  test.isUndefined(result.genre,
    'findOne returns an object without the included genre');
  test.equal(result, {_id: result._id},
    "findOne returns an object which has been stripped of all fields");

  result = books.where({}, {
    fields: {
      catalogId: 1
    }
  }).find({}, {
    fields: {
      genre: 1
    }
  }).fetch();
  test.equal(result, books.find({}, { fields: {
    _id: 1
  }}).fetch(),
    "narrowed find results are identical to a call to find with equivilent field specifier");
});

Tinytest.add('CollectionViews - field specifier - subsequent calls to where continue to narrow the collection', function (test) {
  var books = newCollection();
  var result = books.where({}, {
    fields: {
      catalogId: 0
    }
  }).where({}, {
    fields: {
      genre: 0
    }
  }).findOne();
  test.isUndefined(result.catalogId,
    'findOne returns an object without the excluded catalogId');
  test.isUndefined(result.genre,
    'findOne returns an object without the excluded genre');
  test.equal(result, _.omit(books.findOne(result._id), 'catalogId', 'genre'),
    "findOne returns an object which otherwise matches the original object");

  result = books.where({}, {
    fields: {
      catalogId: 0
    }
  }).where({}, {
    fields: {
      genre: 0
    }
  }).find().fetch();
  test.equal(result, books.find({}, { fields: {
    genre: 0
    , catalogId: 0
  }}).fetch(),
    "narrowed find results are identical to a call to find with equivilent field specifier");

  result = books.where({}, {
    fields: {
      catalogId: 1
    }
  }).where({}, {
    fields: {
      genre: 1
    }
  }).findOne();
  test.isUndefined(result.catalogId,
    'findOne returns an object without the included catalogId');
  test.isUndefined(result.genre,
    'findOne returns an object without the included genre');
  test.equal(result, {_id: result._id},
    "findOne returns an object which has been stripped of all fields");

  result = books.where({}, {
    fields: {
      catalogId: 1
    }
  }).where({}, {
    fields: {
      genre: 1
    }
  }).find().fetch();
  test.equal(result, books.find({}, { fields: {
    _id: 1
  }}).fetch(),
    "narrowed find results are identical to a call to find with equivilent field specifier");
});

Tinytest.add('CollectionViews - field specifier - correctly handles super complex set of field specifiers', function (test) {
  var books = newCollection();
  var result = books.where({}, {
    fields: {
      catalogId: 1
      , genre: 1
      , kind: 1
      , title: 1
    }
  }).where({}, {
    fields: {
      catalogId: 0
    }
  }).findOne({}, {
    fields: {
      genre: 1
      , title: 1
      , catalogId: 1
      , kind: 0
    }
  });
  test.equal(result, _.pick(books.findOne(result._id), '_id', 'title', 'genre'),
    "findOne returns an object which otherwise matches the original object");
});

Tinytest.add('CollectionViews - field specifier - works with a query specifier', function (test) {
  var books = newCollection();
  var result = books.where({
    genre: 'fiction'
  }, {
    fields: {
      catalogId: 1
    }
  }).find().fetch();
  test.equal(result, books.find({genre: 'fiction'}, {fields: { catalogId: 1 }}).fetch(),
    "narrowed find results match equivilent find operation");
});

// Set up different publications to test
if (Meteor.isServer) {
  books = new Mongo.Collection('books1');
  books = seedCollection(books);
  books.where({ kind: 'book' }).publish("myBooks");
  
  magazines = new Mongo.Collection('books2');
  magazines = seedCollection(magazines);
  magazines.where({ kind: 'magazine' }, { limit: 1 }).publish("oneMagazine");
  
  fictionBooks = new Mongo.Collection('books3');
  fictionBooks = seedCollection(fictionBooks);
  fictionBooks.where({ kind: 'book' }).publish("fictionBooks", { genre: 'fiction' });
  
  twoBooks = new Mongo.Collection('books4');
  twoBooks = seedCollection(twoBooks);
  twoBooks.publish("twoBooks", { kind: 'book'}, { limit: 2 });
  
  scienceMagazines = new Mongo.Collection('books5');
  scienceMagazines = seedCollection(scienceMagazines);
  scienceMagazines
    .where({ kind: 'magazine' })
    .where({ genre: 'science' })
    .publish("scienceMagazines");
}

Tinytest.addAsync('CollectionViews - publish - works with `where`\'s query argument', function(test, next) {
  var conn = DDP.connect('http://localhost:3000');
  var collection = new Mongo.Collection('books1', conn);
  conn.subscribe('myBooks', function() {
    test.equal(collection.find().count(), 3);
    next();
  });
});

Tinytest.addAsync('CollectionViews - publish - works with `where`\'s query and options arguments', function(test, next) {
  var conn = DDP.connect('http://localhost:3000');
  var collection = new Mongo.Collection('books2', conn);
  conn.subscribe('oneMagazine', function() {
    test.equal(collection.find().count(), 1);
    next();
  });
});

Tinytest.addAsync('CollectionViews - publish - works with `where`\'s query and `publish`\'s query arguments', function(test, next) {
  var conn = DDP.connect('http://localhost:3000');
  var collection = new Mongo.Collection('books3', conn);
  conn.subscribe('fictionBooks', function() {
    test.equal(collection.find().count(), 2);
    next();
  });
});

Tinytest.addAsync('CollectionViews - publish - works with `publish`\'s query and options arguments', function(test, next) {
  var conn = DDP.connect('http://localhost:3000');
  var collection = new Mongo.Collection('books4', conn);
  conn.subscribe('twoBooks', function() {
    test.equal(collection.find().count(), 2);
    next();
  });
});

Tinytest.addAsync('CollectionViews - publish - works with chained `where` methods', function(test, next) {
  var conn = DDP.connect('http://localhost:3000');
  var collection = new Mongo.Collection('books5', conn);
  conn.subscribe('scienceMagazines', function() {
    test.equal(collection.find().count(), 1);
    test.equal(collection.findOne().title, 'Science Magazine 1');
    next();
  });
});

function newCollection () {
  var collection = new Mongo.Collection(null);
  collection = seedCollection(collection);
  return collection;
}

function seedCollection (collection) {
  collection.remove({});
  collection.insert({ title: 'Fiction Book 1', kind: 'book', genre: 'fiction', catalogId: 0 });
  collection.insert({ title: 'Fiction Book 2', kind: 'book', genre: 'fiction', catalogId: 1 });
  collection.insert({ title: 'Science Book 1', kind: 'book', genre: 'science', catalogId: 2 });
  collection.insert({ title: 'Science Magazine 1', kind: 'magazine', genre: 'science', catalogId: 3 });
  collection.insert({ title: 'Fiction Magazine 1', kind: 'magazine', genre: 'fiction', catalogId: 4 });
  collection.insert({ title: 'Removable 1', kind: 'kind1', genre: 'removable', catalogId: 5 });
  collection.insert({ title: 'Removable 2', kind: 'kind2', genre: 'removable', catalogId: 6 });
  collection.insert({ title: 'Removable 3', kind: 'kind2', genre: 'removable', catalogId: 7 });
  collection.insert({ title: 'Non-Removable 1', kind: 'kind2', genre: 'nonremovable', catalogId: 8 });
  collection.insert({ title: 'Removable 4', kind: 'kind3', genre: 'removable', catalogId: 9 });
  collection.insert({ title: 'Chainable 1', kind: 'leaflet', genre: 'advertising', year: 1999, catalogId: 10 });
  collection.insert({ title: 'Chainable 2', kind: 'leaflet', genre: 'cooking', year: 1999, catalogId: 11 });
  collection.insert({ title: 'Chainable 3', kind: 'tome', genre: 'cooking', year: 1999, catalogId: 12 });
  collection.insert({ title: 'Chainable 4', kind: 'tome', genre: 'cooking', year: 2000, catalogId: 13 });
  collection.insert({ title: 'Chainable 5', kind: 'tome', genre: 'advertising', year: 2001, catalogId: 14 });
  return collection;
}