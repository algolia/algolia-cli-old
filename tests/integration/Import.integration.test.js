const importToAlgolia = require(`${__dirname}/../../commands/Import.js`);
const algoliasearch = require('algoliasearch');
const readLine = require('readline');

// Configure Algolia
const appId = process.env.ALGOLIA_TEST_APP_ID;
const apiKey = process.env.ALGOLIA_TEST_API_KEY;
const indexName = process.env.ALGOLIA_TEST_INDEX_NAME;

const client = algoliasearch(appId, apiKey);
const index = client.initIndex(indexName);

// Configure test file/directory paths
const mocksDir = `${__dirname}/../mocks`;
const dataDir = `${mocksDir}/import`;
const transformation = `${mocksDir}/users-transformation.js`;

// Mock user input params
const program = {
  sourcefilepath: dataDir,
  algoliaappid: appId,
  algoliaapikey: apiKey,
  algoliaindexname: indexName,
  batchsize: 1000,
  transformationfilepath: transformation,
};

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

describe('Import command OK', () => {
  beforeAll(async () => {
    const content = await index.clearIndex();
    await index.waitTask(content.taskID);
  }, 60000);

  test('Import directory of users files to Algolia', done => {
    const endMsg = 'Done reading files';
    // Mock global console.log() function
    // Each time it's called check if import is logging "Done" message
    // If it is done, query newly populated index to test data integrity
    global.console.log = jest.fn(async msg => {
      if (msg.match(endMsg)) {
        await wait(10000);
        const hits = await index.search({ query: '', hitsPerPage: 3 });
        const hasName = hits.hits[0].hasOwnProperty('name');
        const hasGender = hits.hits[0].hasOwnProperty('gender');
        const hasLocation = hits.hits[0].hasOwnProperty('location');
        const hasEmail = hits.hits[0].hasOwnProperty('email');
        const hasScore = hits.hits[0].hasOwnProperty('score');
        const hasIndex = hits.hits[0].hasOwnProperty('index');
        const hasTitle = hits.hits[0].hasOwnProperty('title');
        const hasValue = hits.hits[0].hasOwnProperty('value');
        const isJsonRecord =
          hasName && hasGender && hasLocation && hasEmail && hasScore;
        const isCsvRecord = hasScore && hasIndex && hasTitle && hasValue;
        const isValidRecord = isJsonRecord || isCsvRecord;

        // Expectations
        expect(hits.hits).toHaveLength(3);
        expect(isValidRecord).toBe(true);
        done();
      } else {
        process.stdout.write('\n');
        readLine.cursorTo(process.stdout, 0);
        process.stdout.write(msg);
      }
    });

    // Execute import
    importToAlgolia.start(program);
  }, 120000); // Allocate 2 mins max for test to run

  afterAll(async () => {
    // Clear Algolia index
    await index.clearIndex();
  }, 60000);
});
