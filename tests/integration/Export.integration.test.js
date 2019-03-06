const exportScript = require(`${__dirname}/../../commands/Export.js`);
const fs = require('fs');
const rimraf = require('rimraf');
const algolia = require('algoliasearch');
const HttpsAgent = require('agentkeepalive').HttpsAgent;
const keepaliveAgent = new HttpsAgent({
  maxSockets: 1,
  maxKeepAliveRequests: 0, // no limit on max requests per keepalive socket
  maxKeepAliveTime: 30000, // keepalive for 30 seconds
});
const path = require('path');

const users = require('../mocks/users.json');
const tempDir = path.join(__dirname, '../temp');
const hitsPath = path.join(tempDir, 'algolia-index-algolia-cli-test-1.json');

const appId = process.env.ALGOLIA_TEST_APP_ID;
const apiKey = process.env.ALGOLIA_TEST_API_KEY;
const indexName = process.env.ALGOLIA_TEST_INDEX_NAME;

const client = algolia(appId, apiKey, keepaliveAgent);
const index = client.initIndex(indexName);

const program = {
  algoliaappid: appId,
  algoliaapikey: apiKey,
  algoliaindexname: indexName,
  outputpath: tempDir,
};
users[0].objectID = `user${Math.floor(Math.random() * 10000) + 1}`;

describe('Export command OK', () => {
  beforeAll(async () => {
    // Make temp dir for test output
    rimraf.sync(tempDir);
    fs.mkdirSync(tempDir);

    // Clear Algolia index, then add users objects
    await index.clearIndex();
    const content = await index.addObjects(users);
    await index.waitTask(content.taskID);
  }, 60000);

  test('export retrieves correct records', done => {
    const doneMsg = 'Done exporting index.';
    // Mock globabl console.log() function
    // Each time it's called check if import is logging "Done" message
    // If it is done, read newly written files to test data integrity
    global.console.log = jest.fn(msg => {
      if (msg.match(doneMsg)) {
        const hits = JSON.parse(fs.readFileSync(hitsPath, 'utf-8'));
        expect(hits.some(hit => hit.objectID === users[0].objectID)).toBe(true);
        done();
      }
    });

    // Execute export
    exportScript.start(program);
  }, 60000);

  afterAll(async () => {
    rimraf.sync(tempDir);

    // Clear Algolia index
    await index.clearIndex();
  }, 60000);
});
