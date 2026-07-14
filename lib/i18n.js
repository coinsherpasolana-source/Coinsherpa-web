const vi = require('../locales/vi.json');
const en = require('../locales/en.json');

const LOCALES = { vi, en };

function getDictionary(locale = 'vi') {
  return LOCALES[locale] || LOCALES.vi;
}

module.exports = { getDictionary };
