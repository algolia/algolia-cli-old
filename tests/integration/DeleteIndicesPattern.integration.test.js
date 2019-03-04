const deleteIndicesPattern = require('../../scripts/DeleteIndicesPattern');
const algoliasearch = require('algoliasearch');
const randomize = require('randomatic');

// Configure Algolia
const appId = process.env.ALGOLIA_TEST_APP_ID;
const apiKey = process.env.ALGOLIA_TEST_API_KEY;
const client = algoliasearch(appId, apiKey);

describe('DeleteIndicesPattern command OK', () => {
  const randomName = `algolia-cli-deleteindices-${randomize('aA0', 20)}`;
  const masterIndexName = `${randomName}-master-algolia-cli`;
  const replicas = [
    `${randomName}-replica1-algolia-cli`,
    `${randomName}-replica2-algolia-cli`,
  ];

  beforeAll(async () => {
    const index = client.initIndex(masterIndexName);
    const { taskID } = await index.setSettings({ replicas });
    await index.waitTask(taskID);
  }, 60000);

  test('It works', async () => {
    const { items: indices } = await client.listIndexes();
    const indicesToFind = [masterIndexName, ...replicas];
    const allIndicesNames = indices.map(({ name }) => name);

    // all indices must be created at this point
    expect(
      indicesToFind.every(indexName => allIndicesNames.includes(indexName))
    ).toBe(true);

    await deleteIndicesPattern.start({
      algoliaappid: process.env.ALGOLIA_TEST_APP_ID,
      algoliaapikey: process.env.ALGOLIA_TEST_API_KEY,
      regexp: new RegExp(`^${randomName}`),
      dryrun: 'false',
    });

    const { items: newIndices } = await client.listIndexes();
    const allNewIndicesNames = newIndices.map(({ name }) => name);

    // all indices must be deleted at this point
    expect(
      indicesToFind.every(
        indexName => allNewIndicesNames.includes(indexName) === false
      )
    ).toBe(true);
  }, 120000); // Allocate 2 mins max for test to run

  afterAll(async () => {}, 60000);
});
