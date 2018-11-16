const fs = require('fs');
const transformLinesScript = require(`${__dirname}/../../scripts/TransformLines.js`);

const tempDir = `${__dirname}/../temp`;
const mocksDir = `${__dirname}/../mocks`;
const filename = 'users.json';
const usersData = `${mocksDir}/${filename}`;
const transformedUsersData = `${tempDir}/${filename}`;
const transformations = `${mocksDir}/users-line-transformation.js`;

const program = {
  sourcefilepath: usersData,
  outputfilepath: tempDir,
  transformationfilepath: transformations,
};

const countLines = filePath =>
  // Count newlines by checking buffer for it's ASCII charCode (10)
  new Promise((resolve, reject) => {
    let i;
    let count = 0;
    require('fs')
      .createReadStream(filePath)
      .on('data', chunk => {
        /* eslint-disable-next-line eqeqeq */
        for (i = 0; i < chunk.length; ++i) if (chunk[i] == 10) count++;
      })
      .on('end', () => {
        resolve(count);
      })
      .on('error', reject);
  });

describe('TransformLines command OK', () => {
  beforeAll(() => {
    // Make temp dir for test output
    if (fs.existsSync(tempDir)) {
      if (fs.existsSync(transformedUsersData))
        fs.unlinkSync(transformedUsersData);
      fs.rmdirSync(tempDir);
    }
    fs.mkdirSync(tempDir);
  });

  test('Transform users file', done => {
    transformLinesScript.start(program);
    setTimeout(async () => {
      const exists = fs.existsSync(transformedUsersData);
      const isFile = fs.lstatSync(transformedUsersData).isFile();
      const lines = await countLines(transformedUsersData);

      expect(exists).toBe(true);
      expect(isFile).toBe(true);
      expect(lines).toBe(5001);
      done();
    }, 1000);
  });

  afterAll(() => {
    // Remove temp dir for test output
    if (fs.existsSync(tempDir)) {
      if (fs.existsSync(transformedUsersData))
        fs.unlinkSync(transformedUsersData);
      fs.rmdirSync(tempDir);
    }
  });
});
