# Narrowed collection views

Creates a "where" method for your collections for narrowing your queriesmocks the results of a db operation.

**This is a work in progress.**

### Installation
Simply add the `useful:collection-views` package to your meteor app and you can start using the `where` methods on your collections.

### Examples
```
 myCollection.where({ kind: 'book' }).findOne({ genre: 'fiction' }) 
 // -> { kind: 'book', genre: 'fiction' }
```

```
 myCollection.where({ kind: 'book'}).update({}, { $set: { catalogId: 1 } })
 // -> updates only books
```

```
 myCollection.where(function () { return { owner: Meteor.userId() }; }).findOne() 
 // -> { owner: 'xxxx' }
```

### How it works

- `Mongo.Collection.prototype.where` is a function which takes a single argument (a query or a function which returns a query) and returns a `CollectionView`

- A `CollectionView` supports all of the methods on the `Mongo.Collection.prototype` (at the time it was initialized)


- `CollectionView.prototype.find` and `CollectionView.prototype.findOne` only returns documents which match both queries (the query specified in the call to where and the query specified in the call to `find` / `findOne`.

- `CollectionView.prototype.update` and `CollectionView.prototype.remove` only affect documents which match both queries


- `CollectionView.prototype.where` is a function which returns a further narrowed `CollectionView`

- The query argument specified by a call to where should be lazily resolved, for example if it is a function, it should not be resolved until a call to find, findOne, or update, etc.