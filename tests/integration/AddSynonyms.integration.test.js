const path = require('path');
const addSynonymsScript = require(`${__dirname}/../../scripts/AddSynonyms.js`);
const algolia = require('algoliasearch');

const appId = process.env.ALGOLIA_TEST_APP_ID;
const apiKey = process.env.ALGOLIA_TEST_API_KEY;
const indexName = process.env.ALGOLIA_TEST_INDEX_NAME;

const client = algolia(appId, apiKey);
const index = client.initIndex(indexName);

const synonymsJSONPath = path.resolve(
  process.cwd(),
  'tests/mocks/addSynonyms/synonyms.json'
);

const synonymsCSVPath = path.resolve(
  process.cwd(),
  'tests/mocks/addSynonyms/synonyms.csv'
);

const program = {
  algoliaappid: appId,
  algoliaapikey: apiKey,
  algoliaindexname: indexName,
};

describe('addSynonyms command OK', () => {
  beforeAll(async () => {
    const content = await index.clearSynonyms();
    await index.waitTask(content.taskID);
  });

  test('addsynonyms gets successful response with JSON file', async done => {
    global.console.log = jest.fn();
    // Add synonyms then check object properties to validate successful response
    await addSynonymsScript.start(
      Object.assign({}, program, { sourcefilepath: synonymsJSONPath })
    );
    expect(global.console.log).toHaveBeenLastCalledWith({
      taskID: expect.any(Number),
      updatedAt: expect.any(String),
    });
    done();
  });

  test('addsynonyms gets successful response with CSV file', async done => {
    global.console.log = jest.fn();
    // Add synonyms then check object properties to validate successful response
    await addSynonymsScript.start(
      Object.assign({}, program, { sourcefilepath: synonymsCSVPath })
    );
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
