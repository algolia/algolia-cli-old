const searchScript = require(`${__dirname}/../../scripts/Search.js`);
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

const objects = [
  { id: '1897yt6guyhiy87t6yug7tg187d121knjhbguyt76y8' },
  { id: 'i90u8y7t6fygu17t6f2ye6r15ft2y7t6re51768t72d' },
];

describe('Search command OK', () => {
  beforeAll(async () => {
    await index.clearIndex();
    const { taskID } = await index.addObjects(objects);
    await index.waitTask(taskID);
  });

  test('Search returns hits', async done => {
    const logSpy = jest.spyOn(global.console, 'log');
    const regex = new RegExp(`(${objects[0].id}|${objects[1].id})`);
    // Execute Search
    await searchScript.start(program);
    // Check if settings we just retrieved match ones retrieved by script
    expect(logSpy).toHaveBeenCalledWith(expect.stringMatching(regex));
    done();
  });

  afterAll(async () => {
    await index.clearIndex();
  });
});
