const fs = require('fs');
const setSettingsScript = require(`${__dirname}/../../scripts/SetSettings.js`);
const algolia = require('algoliasearch');

const tempDir = `${__dirname}/../temp`;
const settingsFile = 'algolia-cli-test-settings.json';
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

describe('SetSettings command OK', () => {
  beforeAll(async done => {
    // Make temp dir for test output
    if (fs.existsSync(tempDir)) {
      if (fs.existsSync(settingsPath)) fs.unlinkSync(settingsPath);
      fs.rmdirSync(tempDir);
    }
    fs.mkdirSync(tempDir);
    // Get sample index settings
    const settings = await index.getSettings();
    // Write settings file to be read by setSettings script
    fs.writeFileSync(
      settingsPath,
      JSON.stringify(settings)
    );
    done();
  });

  test('setsettings gets successful response', async done => {
    global.console.log = jest.fn();
    // Get a baseline of the settings on the index
    await setSettingsScript.start(program);
    expect(global.console.log).toHaveBeenLastCalledWith({
      taskID: expect.anything(),
      updatedAt: expect.anything(),
    });
    done();
  });

  afterAll(done => {
    // Remove temp dir for test output
    if (fs.existsSync(tempDir)) {
      if (fs.existsSync(settingsPath)) fs.unlinkSync(settingsPath);
      fs.rmdirSync(tempDir);
    }
    done();
  });
});
