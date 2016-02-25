Package.describe({
  name: 'useful:collection-views',
  version: '0.2.0',
  summary: 'Creates a "where" method for your collections for narrowing your queries',
  git: 'https://github.com/usefulio/collection-views.git',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.2.1');
  api.addFiles('collection-views.js');

  api.use([
    'mongo'
    , 'ecmascript'
    , 'underscore'
  ]);
});

Package.onTest(function(api) {
  api.use([
    'tinytest'
    , 'mongo'
    , 'underscore'
  ]);
  api.use('useful:collection-views');
  api.addFiles('collection-views-tests.js');
});
