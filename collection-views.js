/**
 * @summary A CollectionView represents a filtered view of a Mongo.Collection
 * @instancename collectionView
 */
CollectionView = function (sourceCollection) {
  if (sourceCollection instanceof CollectionView) {
    this._mongoCollection = sourceCollection._mongoCollection
    this._parentCollection = sourceCollection;
  } else if (sourceCollection instanceof Mongo.Collection) {
    this._mongoCollection = sourceCollection;
  } else
    // we don't need to support collection views which auto-create a backing collection
    throw new Error('CollectionView must have a backing mongo collection');
  
  var self = this;

  // We want users to be able to treat this as an ordinary mongo collection
  // so here we attach all the Mongo.Collection.prototype methods
  _.each(Mongo.Collection.prototype, function (val, key) {
    if (! _.has(CollectionView.prototype, key)) {
      self[key] = function () {
        return self._mongoCollection[key].apply(self._mongoCollection, arguments);
      }
    }
  });

 // We need to override these fields to correctly mutate the selector argument
 // "find", "findOne", "insert", "update", "remove", "upsert"
  _.each(["find", "findOne"], function (key) {
    self[key] = function (/*selector, options, callback*/) {
      var args = _.toArray(arguments);
      
      // Pull off any callback
      var callback;
      if (args.length &&
          (args[args.length - 1] === undefined ||
           args[args.length - 1] instanceof Function)) {
        callback = args.pop();
      }

      // We use the mongo package's internal methods to properly extract the arguments
      var selector = self._getFindSelector(args);
      var options = self._getFindOptions(args);

      selector = self._mutateSelector(selector);
      options = self._mutateOptions(options);

      return self._mongoCollection[key](selector, options, callback);
    };
  });

  _.each(["update", "remove", "upsert"], function (key) {
    self[key] = function (selector) {
      var args = _.toArray(arguments);
      args[0] = self._mutateSelector(selector);

      // Warn the developer if field specifier is detected
      var narrowingOptions = self._mutateOptions();
      _.each(narrowingOptions, function (val, argKey) {
        if (argKey == 'fields') {
          console.warn('Passing a "fields" argument has no effect on the "' + key + '" method!');
        }
      });

      return self._mongoCollection[key].apply(self._mongoCollection, args);
    };
  });
}

/**
 * @summary A method which takes a single argument (a query or a function which returns a query)
 *          and returns a CollectionView
 * @locus Anywhere
 * @method where
 * @memberOf Mongo.Collection
 * @param {Object | Function} query A query object or function used to filter the results of a collection operation
 * @return {Object} The narrowed collection view object
 */
Mongo.Collection.prototype.where = CollectionView.prototype.where = function (query, fields) {
  var sourceCollection = this;
  var collectionView = new CollectionView(sourceCollection);
  collectionView._narrowingQuery = { query: query };
  if (! _.isUndefined(fields))
    collectionView._narrowingOptions = { fields: fields };
  return collectionView;
};

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
    , query = query || {};

  while (collection) {
    if (! _.isUndefined(collection._narrowingQuery)) {
      var narrowingQuery = collection._narrowingQuery.query;
      // If narrowingQuery is a function we should pass the result of calling that function
      if (_.isFunction(narrowingQuery))
        narrowingQuery = narrowingQuery();
      _.extend(query, narrowingQuery);
    }
    collection = collection._parentCollection;
  }

  if (LocalCollection._selectorIsId(selector))
    selector = {_id: selector};

  return _.extend({}, selector, query);
};

/**
 * @summary This function builds the options object by extending the parent's options object
 * @locus Anywhere
 * @protected
 * @method _mutateOptions
 * @memberOf CollectionView
 * @param {Object | String} The input options
 * @return {Object} The chained options object
 */
CollectionView.prototype._mutateOptions = function (options) {
  var collection = this
    , options = options || {};

  while (collection) {
    if (! _.isUndefined(collection._narrowingOptions)) {
      _.each(collection._narrowingOptions, function (val, key) {
        if (! _.isUndefined(options[key]))
          _.extend(options[key], val);
        else
          options[key] = val;
      });
    }
    
    collection = collection._parentCollection;
  }

  return options;
};