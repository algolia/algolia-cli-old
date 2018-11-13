const fs = require('fs');
const setSettingsScript = require(`${__dirname}/../../scripts/SetSettings.js`);
const algolia = require('algoliasearch');

const tempDir = `${__dirname}/../temp`;
const settingsFile = 'algolia-cli-test-settings.js';
const settingsPath = `${tempDir}/${settingsFile}`;

const appId = process.env.ALGOLIA_TEST_APP_ID;
const apiKey = process.env.ALGOLIA_TEST_API_KEY;
const indexName = process.env.ALGOLIA_TEST_INDEX_NAME;

const client = algolia(appId, apiKey);
const index = client.initIndex(indexName);

const program = {
  algoliaappid: appId,
  algoliaapikey: apiKey,
  algoliaindexname: indexName,
  sourcefilepath: settingsPath,
};

// let output = '';

global.console.log = jest.fn();

describe('Test: setSettings command OK', () => {
  beforeAll(async () => {
    // Make temp dir for test output
    if (fs.existsSync(tempDir)) {
      if (fs.existsSync(settingsPath)) fs.unlinkSync(settingsPath);
      fs.rmdirSync(tempDir);
    }
    fs.mkdirSync(tempDir);
    // Write settings file to be read by setSettings script
    const settings = await index.getSettings();
    fs.writeFileSync(
      settingsPath,
      `module.exports = ${JSON.stringify(settings)};`
    );
  });

  test(
    'setsettings gets successful response',
    done => {
      // Get a baseline of the settings on the index
      setSettingsScript.start(program);
      setTimeout(() => {
        // Check if setSettings response indicate success
        expect(global.console.log).toHaveBeenLastCalledWith({
          taskID: expect.anything(),
          updatedAt: expect.anything(),
        });
        done();
      }, 1000);
    },
    2000
  );

  afterAll(() => {
    // Remove temp dir for test output
    if (fs.existsSync(tempDir)) {
      if (fs.existsSync(settingsPath)) fs.unlinkSync(settingsPath);
      fs.rmdirSync(tempDir);
    }

    jest.resetAllMocks();
  });
});
