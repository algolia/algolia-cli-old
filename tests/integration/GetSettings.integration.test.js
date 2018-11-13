const getSettingsScript = require(`${__dirname}/../../scripts/GetSettings.js`);
const algolia = require('algoliasearch');

const appId = process.env.ALGOLIA_TEST_APP_ID;
const apiKey = process.env.ALGOLIA_TEST_API_KEY;
const indexName = process.env.ALGOLIA_TEST_INDEX_NAME;

const client = algolia(appId, apiKey);
const index = client.initIndex(indexName);

const program = {
  algoliaappid: appId,
  algoliaapikey: apiKey,
  algoliaindexname: indexName,
};

global.console.log = jest.fn();

describe('Test: getSettings command OK', () => {
  test('getsettings returns settings object', async done => {
    // Get a baseline of the settings on the index
    const settings = await index.getSettings();
    getSettingsScript.start(program);
    setTimeout(() => {
      // Check if settings we just retrieved match ones retrieved by script
      expect(global.console.log).toHaveBeenLastCalledWith(settings);
      done();
    }, 1000);
  });

  afterAll(() => {
    jest.resetAllMocks();
  });
});
