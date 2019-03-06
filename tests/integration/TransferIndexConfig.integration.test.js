const transferIndexConfigScript = require(`${__dirname}/../../commands/TransferIndexConfig.js`);
const algoliasearch = require('algoliasearch');
const readLine = require('readline');
const HttpsAgent = require('agentkeepalive').HttpsAgent;
const keepaliveAgent = new HttpsAgent({
  maxSockets: 1,
  maxKeepAliveRequests: 0, // no limit on max requests per keepalive socket
  maxKeepAliveTime: 30000, // keepalive for 30 seconds
});

// Configure Algolia
const appId = process.env.ALGOLIA_TEST_APP_ID;
const apiKey = process.env.ALGOLIA_TEST_API_KEY;
const indexName = process.env.ALGOLIA_TEST_INDEX_NAME;
const altAppId = process.env.ALGOLIA_TEST_ALT_APP_ID;
const altApiKey = process.env.ALGOLIA_TEST_ALT_API_KEY;
// Test index
const client = algoliasearch(appId, apiKey, keepaliveAgent);
const index = client.initIndex(indexName);
// Alternate test index
const altClient = algoliasearch(altAppId, altApiKey, keepaliveAgent);
const altIndex = altClient.initIndex(indexName);

// Configure test file/directory paths
const defaultSettings = { hitsPerPage: 20 };
const mockSettings = { hitsPerPage: 7 };

// Mock user input
const validProgram = {
  sourcealgoliaappid: appId,
  sourcealgoliaapikey: apiKey,
  sourcealgoliaindexname: indexName,
  destinationalgoliaappid: altAppId,
  destinationalgoliaapikey: altApiKey,
};

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

describe('TransferIndexConfig command OK', () => {
  beforeAll(async () => {
    const altContent = await altIndex.setSettings(defaultSettings);
    const content = await index.setSettings(mockSettings);
    await altIndex.waitTask(altContent.taskID);
    await index.waitTask(content.taskID);
  }, 60000);

  test('TransferIndexConfig moves settings, synonyms, and rules', async done => {
    const endMsg =
      'Index settings, synonyms, and query rules transferred successfully.';

    // Mock globabl console.log() function
    // Each time it's called check if import is logging "Done" message
    // If it is done, query newly populated index to test data integrity
    global.console.log = jest.fn(async msg => {
      if (msg.match(endMsg)) {
        await wait(10000);
        const settings = await altIndex.getSettings();
        const hitsPerPage = settings.hitsPerPage;
        // Expectations
        expect(hitsPerPage).toEqual(7);
        done();
      } else {
        readLine.cursorTo(process.stdout, 0);
        process.stdout.write(msg);
      }
    });

    // Execute transfer
    await transferIndexConfigScript.start(validProgram);
  }, 60000);

  afterAll(async () => {
    await altIndex.setSettings(defaultSettings);
    await index.setSettings(defaultSettings);
  }, 60000);
});
