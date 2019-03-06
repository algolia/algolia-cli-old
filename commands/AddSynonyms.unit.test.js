const addSynonymsScript = require(`./AddSynonyms.js`);
const HttpsAgent = require('agentkeepalive');
const algolia = require('algoliasearch');
const path = require('path');
const fs = require('fs');

const synonymsPath = path.resolve(
  process.cwd(),
  'tests/mocks/addSynonyms/synonyms.json'
);

jest.mock('agentkeepalive');
jest.mock('algoliasearch');

// Mock Keepalive
HttpsAgent.HttpsAgent = jest.fn();

// Mock Algolia
const message = 'Caught exception';
const batchSynonyms = jest.fn();
const index = { batchSynonyms };
const client = {
  initIndex: jest.fn(),
};
algolia.mockReturnValue(client);

// Mock user input
const validProgram = {
  algoliaappid: 'fake-command-input-1',
  algoliaapikey: 'fake-command-input-2',
  algoliaindexname: 'fake-command-input-3',
  sourcefilepath: synonymsPath,
};

describe('AddSynonyms script OK', () => {
  /* start */
  test('synonyms should be called with valid params', async done => {
    const options = { forwardToReplicas: false, clearExistingSynonyms: false };
    const synonymsFile = await fs.readFileSync(synonymsPath);
    const synonyms = JSON.parse(synonymsFile);
    client.initIndex.mockReturnValueOnce(index);
    await addSynonymsScript.start(validProgram);
    expect(algolia).toHaveBeenCalledWith(
      validProgram.algoliaappid,
      validProgram.algoliaapikey,
      expect.any(Object)
    );
    expect(client.initIndex).toHaveBeenCalledWith(
      validProgram.algoliaindexname
    );
    expect(index.batchSynonyms).toHaveBeenCalledWith(synonyms, options);
    done();
  });

  test('AddSynonyms catches exceptions', async done => {
    try {
      // Mock error during execution
      client.initIndex.mockImplementation(() => {
        throw new Error(message);
      });
      // Execute method
      await addSynonymsScript.start(validProgram);
      throw new Error('This error should not be reached');
    } catch (e) {
      expect(e.message).toEqual(message);
      done();
    }
  });
});
