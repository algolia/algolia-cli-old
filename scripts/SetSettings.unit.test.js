const setSettingsScript = require(`./SetSettings.js`);
const HttpsAgent = require('agentkeepalive');
const algolia = require('algoliasearch');
const path = require('path');
const fs = require('fs');

const settingsPath = path.resolve(
  process.cwd(),
  'tests/mocks/setSettings/settings.json'
);

jest.mock('agentkeepalive');
jest.mock('algoliasearch');

// Mock Keepalive
HttpsAgent.HttpsAgent = jest.fn();

// Mock Algolia
const message = 'Caught exception';
const setSettings = jest.fn();
const index = { setSettings };
const client = {
  initIndex: jest.fn(),
};
algolia.mockReturnValue(client);

// Mock user input
const validProgram = {
  algoliaappid: 'fake-command-input-1',
  algoliaapikey: 'fake-command-input-2',
  algoliaindexname: 'fake-command-input-3',
  sourcefilepath: settingsPath,
};

describe('SetSettings script OK', () => {
  /* start */

  test('Set settings should be called with valid params', async done => {
    const settingsFile = await fs.readFileSync(settingsPath);
    const settings = JSON.parse(settingsFile);
    client.initIndex.mockReturnValueOnce(index);
    await setSettingsScript.start(validProgram);
    expect(algolia).toHaveBeenCalledWith(
      validProgram.algoliaappid,
      validProgram.algoliaapikey,
      expect.any(Object)
    );
    expect(client.initIndex).toHaveBeenCalledWith(
      validProgram.algoliaindexname
    );
    expect(index.setSettings).toHaveBeenCalledWith(settings);
    done();
  });

  test('Set settings catches exceptions', async done => {
    try {
      // Mock error during execution
      client.initIndex.mockImplementation(() => {
        throw new Error(message);
      });
      // Execute method
      await setSettingsScript.start(validProgram);
      throw new Error('This error should not be reached');
    } catch (e) {
      expect(e.message).toEqual(message);
      done();
    }
  });
});
