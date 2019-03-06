const exportRulesCommand = require(`${__dirname}/../../commands/ExportRules.js`);
const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');
const algolia = require('algoliasearch');

const tempDir = path.join(__dirname, '../temp');

const appId = process.env.ALGOLIA_TEST_APP_ID;
const apiKey = process.env.ALGOLIA_TEST_API_KEY;
const indexName = process.env.ALGOLIA_TEST_INDEX_NAME;

const client = algolia(appId, apiKey);
const index = client.initIndex(indexName);

const program = {
  algoliaappid: appId,
  algoliaapikey: apiKey,
  algoliaindexname: indexName,
  outputpath: path.resolve(tempDir, `${indexName}-rules.json`),
};

const fakeRules = [
  {
    condition: { pattern: 'foo', anchoring: 'contains' },
    consequence: { userData: { foo: 'bar' } },
    description: 'Test',
    objectID: '1550287012823',
  },
];

describe('ExportRules command OK', () => {
  beforeAll(async () => {
    // Make temp dir for test output
    rimraf.sync(tempDir);
    fs.mkdirSync(tempDir);
    // Add index query rules
    const response = await index.batchRules(fakeRules, {
      clearExistingRules: false,
    });
    await index.waitTask(response.taskID);
  }, 60000);

  test('exportRules writes rules file', async done => {
    const doneMsg = `Done writing ${program.outputpath}`;
    global.console.log = jest.fn(msg => {
      if (msg.match(doneMsg)) {
        const rules = JSON.parse(fs.readFileSync(program.outputpath, 'utf-8'));
        expect(
          rules.some(rule => rule.objectID === fakeRules[0].objectID)
        ).toBe(true);
        done();
      }
    });
    // Execute ExportRules
    await exportRulesCommand.start(program);
  }, 60000);

  afterAll(async () => {
    rimraf.sync(tempDir);
    await index.clearRules();
  }, 60000);
});
