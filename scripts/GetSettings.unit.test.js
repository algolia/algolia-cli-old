const getSettingsScript = require(`./GetSettings.js`);
const HttpsAgent = require('agentkeepalive');
const algolia = require('algoliasearch');

jest.mock('agentkeepalive');
jest.mock('algoliasearch');

// Mock Keepalive
HttpsAgent.HttpsAgent = jest.fn();

// Mock Algolia
const message = 'Caught exception';
const getSettings = jest.fn();
const index = { getSettings };
const client = {
  initIndex: jest.fn(),
};
algolia.mockReturnValue(client);

// Mock user input
const validProgram = {
  algoliaappid: 'fake-command-input-1',
  algoliaapikey: 'fake-command-input-2',
  algoliaindexname: 'fake-command-input-3',
};

describe('GetSettings script OK', () => {
  /* start */

  test('Get settings should be called with valid params', done => {
    client.initIndex.mockReturnValueOnce(index);
    getSettingsScript.start(validProgram);
    expect(algolia).toBeCalledWith(
      validProgram.algoliaappid,
      validProgram.algoliaapikey,
      expect.any(Object)
    );
    expect(client.initIndex).toBeCalledWith(validProgram.algoliaindexname);
    expect(index.getSettings).toBeCalled();
    done();
  });

  test('Get settings catches exceptions', async done => {
    try {
      // Mock error during execution
      client.initIndex.mockImplementation(() => {
        throw new Error(message);
      });
      // Execute method
      await getSettingsScript.start(validProgram);
      throw new Error('This error should not be reached');
    } catch (e) {
      expect(e.message).toEqual(message);
      done();
    }
  });
});
