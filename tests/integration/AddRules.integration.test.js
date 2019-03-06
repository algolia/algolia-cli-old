const path = require('path');
const addRulesScript = require(`${__dirname}/../../commands/AddRules.js`);
const algolia = require('algoliasearch');

const rulesDir = path.resolve(process.cwd(), 'tests/mocks/addRules');
const rulesFile = 'rules.json';
const rulesPath = `${rulesDir}/${rulesFile}`;

const appId = process.env.ALGOLIA_TEST_APP_ID;
const apiKey = process.env.ALGOLIA_TEST_API_KEY;
const indexName = process.env.ALGOLIA_TEST_INDEX_NAME;

const client = algolia(appId, apiKey);
const index = client.initIndex(indexName);

const program = {
  algoliaappid: appId,
  algoliaapikey: apiKey,
  algoliaindexname: indexName,
  sourcefilepath: rulesPath,
};

describe('SetSettings command OK', () => {
  beforeAll(async () => {
    const content = await index.clearRules();
    await index.waitTask(content.taskID);
  });

  test('setsettings gets successful response', async done => {
    global.console.log = jest.fn();
    // Add rules then check object properties to validate successful response
    await addRulesScript.start(program);
    expect(global.console.log).toHaveBeenLastCalledWith({
      taskID: expect.any(Number),
      updatedAt: expect.any(String),
    });
    done();
  });

  afterAll(async () => {
    const content = await index.clearRules();
    await index.waitTask(content.taskID);
  });
});
