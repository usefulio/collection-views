var testCases = [
  {
    name: 'Vanilla Collection',
    collection: function () {
      var books = new Mongo.Collection(null);
      books.insert({
        name: 'A Book'
      });
      return books;
    },
    narrow: function (books) { return books; },
    query: function () {
      return {};
    },
    assertion: function (docs, test) {
      docs = _.map(docs, function (doc) { return _.omit(doc, '_id'); });
      test.equal(docs, [{ name: 'A Book' }]);
    },
  },
  {
    name: 'Vanilla Collection with regex query',
    collection: function () {
      var books = new Mongo.Collection(null);
      books.insert({
        name: 'A Book'
      });
      books.insert({
        name: 'Other Book'
      });
      books.insert({
        name: 'A Book'
      });
      return books;
    },
    narrow: function (books) { return books; },
    query: function () {
      return {
        name: /Other/
      };
    },
    assertion: function (docs, test) {
      docs = _.map(docs, function (doc) { return _.omit(doc, '_id'); });
      test.equal(docs, [{ name: 'Other Book' }]);
    },
  },
  {
    name: 'Narrowed Collection',
    collection: function () {
      var books = new Mongo.Collection(null);
      books.insert({
        name: 'A Book'
      });
      books.insert({
        name: 'Other Book',
        allowed: true,
      });
      return books;
    },
    narrow: function (books) {
      return books.where({ allowed: true });
    },
    query: function () {
      return {};
    },
    assertion: function (docs, test) {
      docs = _.map(docs, function (doc) { return _.pick(doc, 'name'); });
      test.equal(docs, [{ name: 'Other Book' }]);
    },
  },
  {
    name: 'Narrowed Collection with regex query',
    collection: function () {
      var books = new Mongo.Collection(null);
      books.insert({
        name: 'A Book',
      });
      books.insert({
        name: 'Other Book',
        allowed: true,
      });
      books.insert({
        name: 'A Book',
        allowed: true,
      });
      return books;
    },
    narrow: function (books) {
      return books.where({ allowed: true });
    },
    query: function () {
      return {
        name: /A/
      };
    },
    assertion: function (docs, test) {
      docs = _.map(docs, function (doc) { return _.omit(doc, '_id'); });
      test.equal(docs, [{ name: 'A Book', allowed: true }]);
    },
  },
  {
    name: 'Narrowed Collection with zero results',
    collection: function () {
      var books = new Mongo.Collection(null);
      books.insert({
        name: 'A Book',
      });
      books.insert({
        name: 'Other Book',
        allowed: true,
      });
      books.insert({
        name: 'A Book',
        allowed: true,
      });
      return books;
    },
    narrow: function (books) {
      return books.where({ allowed: true });
    },
    query: function () {
      return {
        name: "X"
      };
    },
    assertion: function (docs, test) {
      docs = _.map(docs, function (doc) { return _.omit(doc, '_id'); });
      test.equal(docs, []);
    },
  },
  {
    name: 'Narrowed Collection with conflicting query',
    collection: function () {
      var books = new Mongo.Collection(null);
      books.insert({
        name: 'A Book',
      });
      books.insert({
        name: 'Other Book',
        allowed: true,
      });
      books.insert({
        name: 'A Book',
        allowed: true,
      });
      return books;
    },
    narrow: function (books) {
      return books.where({ allowed: true });
    },
    query: function () {
      return {
        allowed: false
      };
    },
    assertion: function (docs, test) {
      test.equal(docs, []);
    },
  },
  {
    name: 'Narrowed Collection with chained queries',
    collection: function () {
      var books = new Mongo.Collection(null);
      books.insert({
        name: 'A Book',
      });
      books.insert({
        name: 'Other Book',
        allowed: true,
      });
      books.insert({
        name: 'A Book',
        allowed: true,
      });
      return books;
    },
    narrow: function (books) {
      return books.where({ allowed: true }).where({ name: /A/ });
    },
    query: function () {
      return {};
    },
    assertion: function (docs, test) {
      docs = _.map(docs, function (doc) { return _.omit(doc, '_id'); });
      test.equal(docs, [{ name: 'A Book', allowed: true }]);
    },
  },
  {
    name: 'Deeply nested complex query',
    collection: function () {
      var books = new Mongo.Collection(null);
      books.insert({
        name: 'A Book',
        genre: 'X',
        allowed: false,
      });
      books.insert({
        name: 'B Book',
        genre: 'Y',
      });
      books.insert({
        name: 'Other Book',
        allowed: true,
      });
      books.insert({
        name: 'A Book',
        allowed: true,
        x: {
          y: true,
        },
      });
      books.insert({
        name: 'B Book',
        allowed: true,
      })
      return books;
    },
    narrow: function (books) {
      return books.where({ $or: [
        { allowed: true },
        { allowed: { $exists: false } },
      ] }).where({
        allowed: { $exists: true },
        name: { $in: ['A Book', 'B Book']},
      }).where({
        "x.y": {
          $ne: true
        },
        "$where": 'this.name.match(/Book/)',
      });
    },
    query: function () {
      return {
        $where: "!!this.name",
        name: / Book/,
      };
    },
    assertion: function (docs, test) {
      docs = _.map(docs, function (doc) { return _.omit(doc, '_id'); });
      test.equal(docs, [{ name: 'B Book', allowed: true}]);
    },
  },
];

_.each(testCases, function (testCase) {
  Tinytest.add('CollectionViews - findOne - ' + testCase.name, function (test) {
    var books = testCase.collection();
    var narrowed = testCase.narrow(books);

    var result = _.filter([narrowed.findOne(testCase.query())], _.identity);

    testCase.assertion(result, test);
  });
  Tinytest.add('CollectionViews - find - ' + testCase.name, function (test) {
    var books = testCase.collection();
    var narrowed = testCase.narrow(books);

    var result = narrowed.find(testCase.query()).fetch();

    testCase.assertion(result, test);
  });
  Tinytest.add('CollectionViews - update - ' + testCase.name, function (test) {
    var books = testCase.collection();
    var narrowed = testCase.narrow(books);

    narrowed.update(testCase.query(), { $set: { updated: true } })

    var result = _.map(books.find({ updated: true }).fetch(), function (book) {
      return _.omit(book, 'updated');
    });
    testCase.assertion(result, test);
  });
  // Tinytest.add('CollectionViews - upsert - ' + testCase.name, function (test) {
  //   var books = testCase.collection();
  //   var narrowed = testCase.narrow(books);
  //   var existingIds = _.pluck(books.find().fetch(), '_id');

  //   // We don't have a defined behavior for upserts of narrowed collections
  //   // e.g. what happens when you have a narrowing query like: { $where: 'false' }
  //   // I think that mongo will happily create an object { "$where": 'false' }
  //   // which is probably not what the developer expected
  //   test.throws(function () {
  //     narrowed.upsert(testCase.query(), { $set: { updated: true } });
  //   });
  // });
  Tinytest.add('CollectionViews - upsert - ' + testCase.name, function (test) {
    var books = testCase.collection();
    var narrowed = testCase.narrow(books);
    var existingIds = _.pluck(books.find().fetch(), '_id');

    narrowed.upsert(testCase.query(), { $set: { updated: true } })

    // We don't actually want to test the insert leg of this here, because we
    // don't actually know what the inserted doc should look like.
    var result = _.map(books.find({ updated: true, _id: { $in: existingIds } }).fetch(), function (book) {
      return _.omit(book, 'updated');
    });
    testCase.assertion(result, test);
  });
  Tinytest.add('CollectionViews - remove - ' + testCase.name, function (test) {
    var books = testCase.collection();
    var narrowed = testCase.narrow(books);
    var originalDocs = books.find().fetch();

    narrowed.remove(testCase.query());

    var deletedDocs = _.filter(originalDocs, function (doc) {
      return !books.findOne(doc._id);
    });
    testCase.assertion(deletedDocs, test);
  });
});