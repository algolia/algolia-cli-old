#!/usr/bin/env node --max_old_space_size=4096
const program = require('commander');
const { version } = require('./package.json');
const chalk = require('chalk');

// Scripts
const importScript = require('./scripts/Import.js');
const exportScript = require('./scripts/Export.js');
const getSettingsScript = require('./scripts/GetSettings.js');
const setSettingsScript = require('./scripts/SetSettings.js');
const transferIndexScript = require('./scripts/TransferIndex.js');
const transferIndexConfigScript = require('./scripts/transferIndexConfig.js');
const transformLinesScript = require('./scripts/TransformLines.js');
const csvToJsonScript = require('./scripts/CsvToJson.js');

program
  .arguments('<command>')
  .option(
    '-s, --sourcefilepath <sourceFilepath>',
    'Source filepath | Required for: "import" and "transformlines" commands'
  )
  .option(
    '-o, --outputpath <outputPath>',
    'Output filepath | Required for: "export" and "transformlines" commands'
  )
  .option(
    '-t, --transformationfilepath <transformationFilepath>',
    'Transformation filepath | Optional for: "import", "transformlines", and "transferindex" commands'
  )
  .option(
    '-a, --algoliaappid <algoliaAppId>',
    'Algolia app ID | Required for: "import" command'
  )
  .option(
    '-k, --algoliaapikey <algoliaApiKey>',
    'Algolia API key | Required for: "import" command'
  )
  .option(
    '-n, --algoliaindexname <algoliaIndexName>',
    'Algolia index name | Required for: "import" command'
  )
  .option(
    '-b, --batchsize <batchSize>',
    'Number of objects to import per batch | Optional for: "import" command'
  )
  .option(
    '-p, --params <params>',
    'Optional params to pass to dependency (eg. <csvToJsonParams>, <algoliaParams>, or <configParams>) | Optional for: "import", "export", and "transferindexconfig" commands'
  )
  .option(
    '-m, --maxconcurrency <maxConcurrency>',
    'Maximum number of concurrent filestreams to process | Optional for: "import" command'
  )
  .option(
    '-d, --destinationalgoliaappid <destinationAlgoliaAppId>',
    'Destination Algolia app ID | Required for: "transferindex" command'
  )
  .option(
    '-y, --destinationalgoliaapikey <destinationAlgoliaApiKey>',
    'Destination Algolia API key | Required for: "transferindex" command'
  )
  .version(version, '-v, --version')
  .on('--help', () => {
    const message = `
Usage:

  $ algolia <COMMAND NAME> [OPTIONS]

Commands:

  1. --help
  2. --version

  3. import -s <sourceFilepath> -a <algoliaAppId> -k <algoliaApiKey> -n <algoliaIndexName> -b <batchSize> -t <transformationFilepath> -m <maxconcurrency> -p <csvToJsonParams>
  4. export -a <algoliaAppId> -k <algoliaApiKey> -n <algoliaIndexName> -o <outputPath> -p <algoliaParams>

  5. getsettings -a <algoliaAppId> -k <algoliaApiKey> -n <algoliaIndexName>
  6. setsettings -a <algoliaAppId> -k <algoliaApiKey> -n <algoliaIndexName> -s <sourceFilepath>

  7. transferindex -a <sourceAlgoliaAppId> -k <sourceAlgoliaApiKey> -n <sourceAlgoliaIndexName> -d <destinationAlgoliaAppId> -y <destinationAlgoliaApiKey> -t <transformationFilepath>
  8. transferindexconfig -a <sourceAlgoliaAppId> -k <sourceAlgoliaApiKey> -n <sourceAlgoliaIndexName> -d <destinationAlgoliaAppId> -y <destinationAlgoliaApiKey> -p <configParams>

  9. transformlines -s <sourceFilepath> -o <outputPath> -t <transformationFilepath>
  10. csvtojson -s <sourceFilepath> -o <outputPath> <csvToJsonParams>

Examples:

  $ algolia --help
  $ algolia --version
  $ algolia import -s ~/Desktop/example_data.json -a EXAMPLE_APP_ID -k EXAMPLE_API_KEY -n EXAMPLE_INDEX_NAME -b 5000 -t ~/Desktop/example_transformations.js -m 4 -p '{"delimiter":[":"]}'
  $ algolia export -a EXAMPLE_APP_ID -k EXAMPLE_API_KEY -n EXAMPLE_INDEX_NAME -o ~/Desktop/output_folder/ -p '{"filters":["category:book"]}'
  $ algolia getsettings -a EXAMPLE_APP_ID -k EXAMPLE_API_KEY -n EXAMPLE_INDEX_NAME
  $ algolia setsettings -a EXAMPLE_APP_ID -k EXAMPLE_API_KEY -n EXAMPLE_INDEX_NAME -s ~/Desktop/example_settings.js
  $ algolia transferindex -a EXAMPLE_SOURCE_APP_ID -k EXAMPLE_SOURCE_API_KEY -n EXAMPLE_SOURCE_INDEX_NAME -d EXAMPLE_DESTINATION_APP_ID -y EXAMPLE_DESTINATION_API_KEY -t ~/Desktop/example_transformations.js
  $ algolia transferindexconfig -a EXAMPLE_SOURCE_APP_ID -k EXAMPLE_SOURCE_API_KEY -n EXAMPLE_SOURCE_INDEX_NAME -d EXAMPLE_DESTINATION_APP_ID -y EXAMPLE_DESTINATION_API_KEY -p '{"batchSynonymsParams":{"forwardToReplicas":true}}'
  $ algolia transformlines -s ~/Desktop/example_source.json -o ~/Desktop/example_output.json -t ~/Desktop/example_transformations.js
`;
    console.log(message);
  })
  .action(command => {
    // Handle commands
    switch (command) {
      case 'import':
        importScript.start(program);
        break;
      case 'export':
        exportScript.start(program);
        break;
      case 'getsettings':
        getSettingsScript.start(program);
        break;
      case 'setsettings':
        setSettingsScript.start(program);
        break;
      case 'transferindex':
        transferIndexScript.start(program);
        break;
      case 'transferindexconfig':
        transferIndexConfigScript.start(program);
        break;
      case 'transformlines':
        transformLinesScript.start(program);
        break;
      case 'csvtojson':
        csvToJsonScript.start(program);
        break;
      default:
        defaultCommand(command);
        break;
    }
  })
  .parse(process.argv);

function registerDefaultProcessEventListeners() {
  // Handle node process exit
  process.on('exit', code => {
    if (code === 0) console.log(chalk.white.bgGreen('\nDone'));
  });
  // Handle ctrl+c event
  process.on('SIGINT', () => {
    process.exitCode = 2;
    console.log(chalk.white.bgYellow('\nCancelled'));
  });
  // Handle uncaught exceptions
  process.on('uncaughtException', () => {
    process.exitCode = 1;
    console.log(chalk.white.bgRed('\nError'));
  });
}

function defaultCommand(command) {
  console.error(`Unknown command "${command}".`);
  console.error('Run "algolia --help" to view options.');
  process.exit(1);
}

function noCommand() {
  console.error('You must specify a command.');
  console.error('Run "algolia --help" to view options.');
  process.exit(1);
}

registerDefaultProcessEventListeners();
if (program.args.length === 0) noCommand();
