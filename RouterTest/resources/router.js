define([], function () {
   return {
      '/': 'OnlineSbisRu',
      '/regex:^([0-9]{5})$': 'OnlineSbisRu/$1',
      '/contacts_vdom.html': 'MessageExt',
      '/a/b': 'ab',
      '/a/b/c/d': 'abcd',
      '/regex:^([a-zA-Z]{4,})$': '/Module/$1',
      '/regex:^([a-zA-Z]{4,})$/path': '/Module/$1/path',
      '/regex:^([a-zA-Z]{4,})$/another-path': '/Module/$1/another-path',
      '/path/regex:^([a-zA-Z]{4,})$': '/Module/path/$1',
      '/path/regex:^([a-zA-Z]{4,})$/regex:^([a-zA-Z]{4,})$': '/Module/path/$1/$2',
      '/path/regex:^([a-zA-Z]{4,})$/some/regex:^([a-zA-Z]{4,})$': '/Module/path/$1/some/$2',
      '/page': 'Module/page'
   };
});
