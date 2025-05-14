module.exports = {
  i18n: {
    defaultLocale: 'ru',
    locales: ['en', 'ru'],
    localeDetection: true,
  },
  localePath: './public/locales',
  reloadOnPrerender: process.env.NODE_ENV === 'development',
};
