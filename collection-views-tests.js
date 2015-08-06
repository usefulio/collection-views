var Books = new Mongo.Collection(null);
Books.remove({});
Books.insert({ title: 'Fiction Book 1', kind: 'book', genre: 'fiction', catalogId: 0 });
Books.insert({ title: 'Fiction Book 2', kind: 'book', genre: 'fiction', catalogId: 1 });
Books.insert({ title: 'Science Book 1', kind: 'book', genre: 'science', catalogId: 2 });
Books.insert({ title: 'Science Magazine 1', kind: 'magazine', genre: 'science', catalogId: 3 });
Books.insert({ title: 'Fiction Magazine 1', kind: 'magazine', genre: 'fiction', catalogId: 4 });
Books.insert({ title: 'Removable 1', kind: 'kind1', genre: 'removable', catalogId: 5 });
Books.insert({ title: 'Removable 2', kind: 'kind2', genre: 'removable', catalogId: 6 });
Books.insert({ title: 'Removable 3', kind: 'kind2', genre: 'removable', catalogId: 6 });
Books.insert({ title: 'Non-Removable 1', kind: 'kind2', genre: 'nonremovable', catalogId: 6 });
Books.insert({ title: 'Removable 4', kind: 'kind3', genre: 'removable', catalogId: 6 });

// findOne() should only return documents which match both queries
Tinytest.add('where - findOne - t1', function (test) {
  var doc = Books.where({ kind: 'book' }).findOne({ genre: 'fiction' });
  test.equal(doc.title, 'Fiction Book 1');
});

Tinytest.add('where - findOne - t2', function (test) {
  var doc = Books.where({ genre: 'science' }).findOne({ kind: 'magazine' });
  test.equal(doc.title, 'Science Magazine 1');
});

// find() should only return documents which match both queries
Tinytest.add('where - find - t1', function (test) {
  var docs = Books.where({ kind: 'book' }).find({ genre: 'fiction' }).fetch();
  test.equal(_.last(docs).title, 'Fiction Book 2');
  test.length(docs, 2);
});

Tinytest.add('where - find - t2', function (test) {
  var docs = Books.where({ genre: 'science' }).find({}).fetch();
  test.equal(docs[0].title, 'Science Book 1');
  test.length(docs, 2);
});

Tinytest.add('where - find - t3 (query can be a function)', function (test) {
  var docs = Books.where(function () {
    return { kind: 'book' }
  }).find({ genre: 'fiction' }).fetch();
  test.equal(_.last(docs).title, 'Fiction Book 2');
  test.length(docs, 2);
});

// update() should only affect documents which match both queries
Tinytest.add('where - update - t1', function (test) {
  var affectedCount = Books.where({ kind: 'book' }).update({}, 
    { $set: { catalogId: 1 } }
    , { multi: true }
  );
  test.equal(affectedCount, 3);
});

Tinytest.add('where - update - t2', function (test) {
  var affectedCount = Books.where({ genre: 'fiction' }).update({ kind: 'book' }, 
    { $set: { catalogId: 1 } }
    , { multi: true }
  );
  test.equal(affectedCount, 2);
});

Tinytest.add('where - update - t3', function (test) {
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

// remove() should only affect documents which match both queries
Tinytest.add('where - remove - t1', function (test) {
  var docs = Books.where({ genre: 'removable' }).find({}).fetch();
  test.length(docs, 4);

  var affectedCount = Books.where({ kind: 'kind2' }).remove({ genre: 'removable' });
  test.equal(affectedCount, 2);

  var docs = Books.where({ genre: 'removable' }).find({}).fetch();
  test.length(docs, 2);
});