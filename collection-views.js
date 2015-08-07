/**
 * @summary A method which takes a single argument (a query or a function which returns a query)
 *          and returns a CollectionView
 * @locus Anywhere
 * @method where
 * @memberOf Mongo.Collection
 * @param {Object | Function} query A query object or function used to filter the results of a collection operation
 * @return {Object} The narrowed collection view object
 */
Mongo.Collection.prototype.where = function (query) {
  var sourceCollection = this;
  var collectionView = new CollectionView(sourceCollection);
  collectionView._narrowingQuery = {query: query}; // XXX this gets overwritten
  collectionView._narrowingParent = sourceCollection;
  return collectionView;
};

/**
 * @summary A CollectionView represents a filtered view of a Mongo.Collection
 * @instancename collectionView
 */
CollectionView = function (sourceCollection) {
  // XXX This is always false:
  if (sourceCollection instanceof CollectionView) {
    this._mongoCollection = sourceCollection._mongoCollection
    this._parentCollection = sourceCollection;
  // XXX And this is always true:
  } else if (sourceCollection instanceof Mongo.Collection) {
    this._mongoCollection = sourceCollection;
  } else
    // we don't need to support collection views which auto-create a backing collection
    throw new Error('CollectionView must have a backing mongo collection');
}

/**
 * @summary We want users to be able to treat this as an ordinary mongo collection
 *          so here we attach all the Mongo.Collection.prototype methods
 */
_.each(Mongo.Collection.prototype, function (val, key) {
  if (typeof val === "function") {
    CollectionView.prototype[key] = function () {
      return this._mongoCollection[key].apply(this._mongoCollection, arguments);
    };
  }
});

/**
 * @summary MONKEY PATCH! We modify the _selectorIsIdPerhapsAsObject to permit ids as part of a client
 *          selector. This doesn't present security problems because the query will
 *          still only find/update a single document with the specified id
 *          e.g. we want to allow selectors like {_id: "123", kind: "public"}
 */
var LocalCollection = Package.minimongo.LocalCollection;
LocalCollection._selectorIsIdPerhapsAsObject = function (selector) {
  return LocalCollection._selectorIsId(selector) ||
    (selector && typeof selector === "object" && selector._id && LocalCollection._selectorIsId(selector._id));
};

/**
 * @summary This function narrows a selector to only include documents from this
 *          collection in the case that the collection was created using a where call
 * @locus Anywhere
 * @protected
 * @method _mutateSelector
 * @memberOf CollectionView
 * @param {Object | String} The input selector
 * @return {Object} The narrowed selector
 */
CollectionView.prototype._mutateSelector = function (selector, query) {
  var collection = this
    , query = query || {}; // XXX <- not sure if this is right

  while (collection) {
    if (! _.isUndefined(collection._narrowingQuery)) {
      var narrowingQuery = collection._narrowingQuery.query;
      // If narrowingQuery is a function we should pass the result of calling that function
      if (_.isFunction(narrowingQuery))
        narrowingQuery = narrowingQuery();
      _.extend(query, narrowingQuery)
    }
    collection = collection._narrowingParent // XXX <- not sure if this is right
  }

  if (LocalCollection._selectorIsId(selector))
    selector = {_id: selector};

  return _.extend({}, selector, query); // XXX <- not sure if this is right
};

/**
 * @summary We need to override these fields to correctly mutate the selector argument
 *          "find", "findOne", "insert", "update", "remove", "upsert"
 */
// XXX when chaining .where() methods, the first one gets overriden
_.each(["find", "findOne"], function (key) {
  CollectionView.prototype[key] = function (selector, callback) {
    selector = this._mutateSelector(selector);
    return this._mongoCollection[key](selector, callback);
  };
});

_.each(["update", "remove", "upsert"], function (key) {
  CollectionView.prototype[key] = function (selector) {
    var args = _.toArray(arguments);
    args[0] = this._mutateSelector(selector);
    return this._mongoCollection[key].apply(this._mongoCollection, args);
  };
});