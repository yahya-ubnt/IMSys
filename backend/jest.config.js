module.exports = {
  testEnvironment: 'node',
  testRegex: '(/__tests__/.*|(\.|/)(test|spec))\.js$',
  moduleFileExtensions: ['js', 'json', 'node'],
  rootDir: '.',
  setupFiles: ['./__tests__/setup.js'],
  testTimeout: 30000,
};