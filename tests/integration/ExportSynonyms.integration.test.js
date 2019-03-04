const exportSynonymScript = require(`${__dirname}/../../scripts/ExportSynonyms.js`);
const algolia = require('algoliasearch');
const path = require('path');
const fs = require('fs');
const rimraf = require('rimraf');

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
  outputpath: path.resolve(tempDir, `${indexName}-synonyms.json`),
};

const fakeSynonyms = [
  {
    type: 'altCorrection1',
    word: 'smartphone',
    corrections: ['iphone'],
    objectID: 'smartphone-syn',
  },
];

describe('ExportSynonyms command OK', () => {
  beforeAll(async () => {
    // Make temp dir for test output
    rimraf.sync(tempDir);
    fs.mkdirSync(tempDir);
    // Add index synonyms
    const response = await index.batchSynonyms(fakeSynonyms, {
      clearExistingSynonyms: false,
    });
    await index.waitTask(response.taskID);
  }, 60000);

  test('exportSynoyms writes syonyms file', async done => {
    const doneMsg = `Done writing ${program.outputpath}`;
    global.console.log = jest.fn(msg => {
      if (msg.match(doneMsg)) {
        const syonyms = JSON.parse(
          fs.readFileSync(program.outputpath, 'utf-8')
        );
        expect(
          syonyms.some(syonym => syonym.objectID === fakeSynonyms[0].objectID)
        ).toBe(true);
        done();
      }
    });
    // Execute ExportSynonyms
    await exportSynonymScript.start(program);
  }, 60000);

  afterAll(async () => {
    rimraf.sync(tempDir);
    await index.clearRules();
  }, 60000);
});
