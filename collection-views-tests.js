// findOne() should only return documents which match both queries
Tinytest.add('where - findOne - t1', function (test) {
  var Books = newCollection();
  var doc = Books.where({ kind: 'book' }).findOne({ genre: 'fiction' });
  test.matches(doc.title, /Fiction Book/);
});

Tinytest.add('where - findOne - t2', function (test) {
  var Books = newCollection();
  var doc = Books.where({ genre: 'science' }).findOne({ kind: 'magazine' });
  test.equal(doc.title, 'Science Magazine 1');
});

// find() should only return documents which match both queries
Tinytest.add('where - find - t1', function (test) {
  var Books = newCollection();
  var docs = Books.where({ kind: 'book' }).find({ genre: 'fiction' }).fetch();
  test.equal(_.pluck(docs, 'title'), ['Fiction Book 1', 'Fiction Book 2'])
  test.length(docs, 2);
});

Tinytest.add('where - find - t2', function (test) {
  var Books = newCollection();
  var docs = Books.where({ genre: 'science' }).find({}).fetch();
  test.equal(_.pluck(docs, 'title'), ['Science Book 1', 'Science Magazine 1'])
  test.length(docs, 2);
});

Tinytest.add('where - find - t3 (query can be a function)', function (test) {
  var Books = newCollection();
  var docs = Books.where(function () {
    return { kind: 'book' }
  }).find({ genre: 'fiction' }).fetch();
  test.equal(_.pluck(docs, 'title'), ['Fiction Book 1', 'Fiction Book 2'])
  test.length(docs, 2);
});

Tinytest.add('where - find - t4 (chaining 2 where methods)', function (test) {
  var Books = newCollection();
  var docs = Books
    .where({ kind: 'book' })
    .where({ genre: 'fiction' })
    .find({})
    .fetch();
  test.equal(_.pluck(docs, 'title'), ['Fiction Book 1', 'Fiction Book 2'])
  test.length(docs, 2);
});

Tinytest.add('where - find - t5 (chaining 3 where methods)', function (test) {
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

Tinytest.add('where - find - t6 (chaining 2 where methods with find query)', function (test) {
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
Tinytest.add('where - update - t1', function (test) {
  var Books = newCollection();
  var affectedCount = Books.where({ kind: 'book' }).update({}, 
    { $set: { catalogId: 1 } }
    , { multi: true }
  );
  test.equal(affectedCount, 3);
});

Tinytest.add('where - update - t2', function (test) {
  var Books = newCollection();
  var affectedCount = Books.where({ genre: 'fiction' }).update({ kind: 'book' }, 
    { $set: { catalogId: 1 } }
    , { multi: true }
  );
  test.equal(affectedCount, 2);
});

Tinytest.add('where - update - t3', function (test) {
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

Tinytest.add('where - update - t4 (chaining where methods)', function (test) {
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

Tinytest.add('where - update - t5 (lazy resolving when argument is function)', function (test) {
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
Tinytest.add('where - remove - t1', function (test) {
  var Books = newCollection();
  var docs = Books.where({ genre: 'removable' }).find({}).fetch();
  test.length(docs, 4);

  var affectedCount = Books.where({ kind: 'kind2' }).remove({ genre: 'removable' });
  test.equal(affectedCount, 2);

  var docs = Books.where({ genre: 'removable' }).find({}).fetch();
  test.length(docs, 2);
});

Tinytest.add('where - remove - t2 (chaining where methods)', function (test) {
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

Tinytest.add('where - remove - t3 (lazy resolving when argument is function)', function (test) {
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
Tinytest.add('where - upsert - t1', function (test) {
  var Books = newCollection();
  var result = Books.where({ kind: 'magazine' }).upsert({}, 
    { $set: { catalogId: 1 } }
    , { multi: true }
  );
  test.equal(result.numberAffected, 2);
});

Tinytest.add('where - upsert - t2 (chainable where methods)', function (test) {
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

Tinytest.add('where - upsert - t3 (lazy resolving when argument is function)', function (test) {
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

Tinytest.add('where - upsert - t4 (no matches found, insert still works)', function (test) {
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

// Test if field specifiers work properly
Tinytest.add('where - field specifiers - t1 (one specifier: only fetch the title)', function (test) {
  var Books = newCollection();
  var doc = Books
    .where({ genre: 'science' }, { title: 1 })
    .findOne({ kind: 'magazine' });
  test.equal(doc.title, 'Science Magazine 1');
  test.isNotUndefined(doc.title);
  test.isUndefined(doc.genre);
  test.isUndefined(doc.kind);
  test.isUndefined(doc.catalogId);
  test.isNotUndefined(doc._id);
  test.isNotNull(doc._id);
  test.equal(typeof doc._id, 'string');
});

Tinytest.add('where - field specifiers - t2 (two chained specifiers: only fetch the title and the kind)', function (test) {
  var Books = newCollection();
  var doc = Books
    .where({}, { title: 1 })
    .where({ genre: 'science' }, { kind: 1 })
    .findOne({ kind: 'magazine' });
  test.equal(doc.title, 'Science Magazine 1');
  test.isNotUndefined(doc.title);
  test.isUndefined(doc.genre);
  test.isNotUndefined(doc.kind);
  test.isUndefined(doc.catalogId);
  test.isNotUndefined(doc._id);
  test.isNotNull(doc._id);
  test.equal(typeof doc._id, 'string');
});

Tinytest.add('where - field specifiers - t3 (one specifier: remove the title)', function (test) {
  var Books = newCollection();
  var doc = Books
    .where({ genre: 'science' }, { title: 0 })
    .findOne({ kind: 'magazine' });
  test.isUndefined(doc.title);
  test.isNotUndefined(doc.genre);
  test.isNotUndefined(doc.kind);
  test.isNotUndefined(doc.catalogId);
  test.isNotUndefined(doc._id);
  test.isNotNull(doc._id);
  test.equal(typeof doc._id, 'string');
});

Tinytest.add('where - field specifiers - t4 (two specifier: remove the kind and catalogId)', function (test) {
  var Books = newCollection();
  var doc = Books
    .where({ genre: 'science' }, { kind: 0 })
    .where({}, { catalogId: 0 })
    .findOne({ kind: 'magazine' });
  test.isNotUndefined(doc.title);
  test.isNotUndefined(doc.genre);
  test.isUndefined(doc.kind);
  test.isUndefined(doc.catalogId);
  test.isNotUndefined(doc._id);
  test.isNotNull(doc._id);
  test.equal(typeof doc._id, 'string');
});

Tinytest.add('where - field specifiers - t5 (two specifiers: only fetch the title)', function (test) {
  var Books = newCollection();
  var doc = Books
    .where({ genre: 'science' }, { catalogId: 0 })
    .where({}, { title: 1 })
    .findOne({ kind: 'magazine' });
  test.equal(doc.title, 'Science Magazine 1');
  test.isNotUndefined(doc.title);
  test.isUndefined(doc.genre);
  test.isUndefined(doc.kind);
  test.isUndefined(doc.catalogId);
  test.isNotUndefined(doc._id);
  test.isNotNull(doc._id);
  test.equal(typeof doc._id, 'string');
});

Tinytest.add('where - field specifiers - t5 (two specifiers: only fetch the title and genre)', function (test) {
  var Books = newCollection();
  var doc = Books
    .where({ genre: 'science' }, { genre: 1 })
    .where({}, { title: 1 })
    .findOne({ kind: 'magazine' });
  test.equal(doc.title, 'Science Magazine 1');
  test.isNotUndefined(doc.title);
  test.isNotUndefined(doc.genre);
  test.isUndefined(doc.kind);
  test.isUndefined(doc.catalogId);
  test.isNotUndefined(doc._id);
  test.isNotNull(doc._id);
  test.equal(typeof doc._id, 'string');
});

function newCollection () {
  var Books = new Mongo.Collection(null);
  Books.remove({});
  Books.insert({ title: 'Fiction Book 1', kind: 'book', genre: 'fiction', catalogId: 0 });
  Books.insert({ title: 'Fiction Book 2', kind: 'book', genre: 'fiction', catalogId: 1 });
  Books.insert({ title: 'Science Book 1', kind: 'book', genre: 'science', catalogId: 2 });
  Books.insert({ title: 'Science Magazine 1', kind: 'magazine', genre: 'science', catalogId: 3 });
  Books.insert({ title: 'Fiction Magazine 1', kind: 'magazine', genre: 'fiction', catalogId: 4 });
  Books.insert({ title: 'Removable 1', kind: 'kind1', genre: 'removable', catalogId: 5 });
  Books.insert({ title: 'Removable 2', kind: 'kind2', genre: 'removable', catalogId: 6 });
  Books.insert({ title: 'Removable 3', kind: 'kind2', genre: 'removable', catalogId: 7 });
  Books.insert({ title: 'Non-Removable 1', kind: 'kind2', genre: 'nonremovable', catalogId: 8 });
  Books.insert({ title: 'Removable 4', kind: 'kind3', genre: 'removable', catalogId: 9 });
  Books.insert({ title: 'Chainable 1', kind: 'leaflet', genre: 'advertising', year: 1999, catalogId: 10 });
  Books.insert({ title: 'Chainable 2', kind: 'leaflet', genre: 'cooking', year: 1999, catalogId: 11 });
  Books.insert({ title: 'Chainable 3', kind: 'tome', genre: 'cooking', year: 1999, catalogId: 12 });
  Books.insert({ title: 'Chainable 4', kind: 'tome', genre: 'cooking', year: 2000, catalogId: 13 });
  Books.insert({ title: 'Chainable 5', kind: 'tome', genre: 'advertising', year: 2001, catalogId: 14 });
  return Books;
}