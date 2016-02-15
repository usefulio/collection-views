Package.describe({
  name: 'useful:collection-views',
  version: '0.0.1',
  summary: 'Creates a "where" method for your collections for narrowing your queries',
  git: 'https://github.com/usefulio/collection-views.git',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.2.1');
  api.addFiles('collection-views.js');

  api.use([
    'mongo'
    , 'underscore'
  ]);
});

Package.onTest(function(api) {
  api.use([
    'tinytest'
    , 'mongo'
  ]);
  api.use('useful:collection-views');
  api.addFiles('collection-views-tests.js');
});
