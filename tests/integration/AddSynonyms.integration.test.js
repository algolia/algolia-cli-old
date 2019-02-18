const path = require('path');
const addSynonymsScript = require(`${__dirname}/../../scripts/AddSynonyms.js`);
const algolia = require('algoliasearch');

const synonymsDir = path.resolve(process.cwd(), 'tests/mocks/addSynonyms');
const synonymsFile = 'synonyms.json';
const synonymsPath = `${synonymsDir}/${synonymsFile}`;

const appId = process.env.ALGOLIA_TEST_APP_ID;
const apiKey = process.env.ALGOLIA_TEST_API_KEY;
const indexName = process.env.ALGOLIA_TEST_INDEX_NAME;

const client = algolia(appId, apiKey);
const index = client.initIndex(indexName);

const program = {
  algoliaappid: appId,
  algoliaapikey: apiKey,
  algoliaindexname: indexName,
  sourcefilepath: synonymsPath,
};

describe('addSynonyms command OK', () => {
  beforeAll(async () => {
    const content = await index.clearSynonyms();
    await index.waitTask(content.taskID);
  });

  test('addsynonyms gets successful response', async done => {
    global.console.log = jest.fn();
    // Add synonyms then check object properties to validate successful response
    await addSynonymsScript.start(program);
    expect(global.console.log).toHaveBeenLastCalledWith({
      taskID: expect.any(Number),
      updatedAt: expect.any(String),
    });
    done();
  });

  afterAll(async () => {
    const content = await index.clearSynonyms();
    await index.waitTask(content.taskID);
  });
});
