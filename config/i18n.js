const i18n = require('i18n');

function initializeI18n(app){
  i18n.configure({
    locales: ['en', 'fr'],
    fallbacks: {
      'en-US': 'en',
      'fr-FR': 'fr',
    },
    directory: __dirname + '/../i18n',
    defaultLocale: 'en',
  });

  app.use(i18n.init);
  // eslint-disable-next-line
  console.log('i18n module initialized. Default locale: ' + i18n.getLocale());

}

module.exports = initializeI18n;
