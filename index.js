#!/usr/bin/env node --max_old_space_size=4096

const program = require('commander');
const { version } = require('./package.json');
const chalk = require('chalk');

// SCRIPTS

const importScript = require('./scripts/Import.js');
const exportScript = require('./scripts/Export.js');
const getSettingsScript = require('./scripts/GetSettings.js');
const setSettingsScript = require('./scripts/SetSettings.js');
const transferIndexScript = require('./scripts/TransferIndex.js');
const transferIndexConfigScript = require('./scripts/transferIndexConfig.js');
const transformLinesScript = require('./scripts/TransformLines.js');

// DOCS

const instructions = `
Usage:

  $ algolia <COMMAND NAME> [OPTIONS]

Commands:

  1. --help
  2. --version
  3. import -s <sourceFilepath> -a <algoliaAppId> -k <algoliaApiKey> -n <algoliaIndexName> -b <batchSize> -t <transformationFilepath> -m <maxconcurrency> -p <csvToJsonParams>
  4. export -a <algoliaAppId> -k <algoliaApiKey> -n <algoliaIndexName> -o <outputPath> -p <algoliaParams>
  5. getsettings -a <algoliaAppId> -k <algoliaApiKey> -n <algoliaIndexName>
  6. setsettings -a <algoliaAppId> -k <algoliaApiKey> -n <algoliaIndexName> -s <sourceFilepath>
  7. transferindex -a <sourceAlgoliaAppId> -k <sourceAlgoliaApiKey> -n <sourceAlgoliaIndexName> -d <destinationAlgoliaAppId> -y <destinationAlgoliaApiKey> -i <destinationIndexName> -t <transformationFilepath>
  8. transferindexconfig -a <sourceAlgoliaAppId> -k <sourceAlgoliaApiKey> -n <sourceAlgoliaIndexName> -d <destinationAlgoliaAppId> -y <destinationAlgoliaApiKey> -i <destinationIndexName> -p <configParams>
  9. transformlines -s <sourceFilepath> -o <outputPath> -t <transformationFilepath>

Examples:

  $ algolia --help
  $ algolia --version
  $ algolia import -s ~/Desktop/example_data.json -a EXAMPLE_APP_ID -k EXAMPLE_API_KEY -n EXAMPLE_INDEX_NAME -b 5000 -t ~/Desktop/example_transformations.js -m 4 -p '{"delimiter":[":"]}'
  $ algolia export -a EXAMPLE_APP_ID -k EXAMPLE_API_KEY -n EXAMPLE_INDEX_NAME -o ~/Desktop/output_folder/ -p '{"filters":["category:book"]}'
  $ algolia getsettings -a EXAMPLE_APP_ID -k EXAMPLE_API_KEY -n EXAMPLE_INDEX_NAME
  $ algolia setsettings -a EXAMPLE_APP_ID -k EXAMPLE_API_KEY -n EXAMPLE_INDEX_NAME -s ~/Desktop/example_settings.js
  $ algolia transferindex -a EXAMPLE_SOURCE_APP_ID -k EXAMPLE_SOURCE_API_KEY -n EXAMPLE_SOURCE_INDEX_NAME -d EXAMPLE_DESTINATION_APP_ID -y EXAMPLE_DESTINATION_API_KEY -i EXAMPLE_DESTINATION_INDEX_NAME -t ~/Desktop/example_transformations.js
  $ algolia transferindexconfig -a EXAMPLE_SOURCE_APP_ID -k EXAMPLE_SOURCE_API_KEY -n EXAMPLE_SOURCE_INDEX_NAME -d EXAMPLE_DESTINATION_APP_ID -y EXAMPLE_DESTINATION_API_KEY -i EXAMPLE_DESTINATION_INDEX_NAME -p '{"batchSynonymsParams":{"forwardToReplicas":true}}'
  $ algolia transformlines -s ~/Desktop/example_source.json -o ~/Desktop/example_output.json -t ~/Desktop/example_transformations.js
`;

// HELPERS

const help = () => console.log(instructions);

const registerDefaultProcessEventListeners = () => {
  // Handle process cancellation
  process.on('SIGINT', () => {
    process.exitCode = 2;
    console.log(chalk.white.bgYellow('\nCancelled'));
  });
  // Handle uncaught exceptions
  process.on('uncaughtException', e => {
    process.exitCode = 1;
    console.log(chalk.white.bgRed('\nUncaught Exception:', e));
  });
};

const defaultCommand = command => {
  console.error(`Unknown command "${command}".`);
  console.error('Run "algolia --help" to view options.');
  process.exit(1);
};

const noCommand = () => {
  console.error('You must specify a command.');
  console.error('Run "algolia --help" to view options.');
  process.exit(1);
};

// COMMANDS

program.version(version, '-v, --version').on('--help', help);

// Import
program
  .command('import')
  .alias('i')
  .description('Import local JSON or CSV data to an Algolia index')
  .option('-s, --sourcefilepath <sourceFilepath>', 'Source filepath | Required')
  .option('-a, --algoliaappid <algoliaAppId>', 'Algolia app ID | Required')
  .option('-k, --algoliaapikey <algoliaApiKey>', 'Algolia API key | Required')
  .option(
    '-n, --algoliaindexname <algoliaIndexName>',
    'Algolia index name | Required'
  )
  .option(
    '-b, --batchsize <batchSize>',
    'Number of objects to import per batch | Optional'
  )
  .option(
    '-t, --transformationfilepath <transformationFilepath>',
    'Transformation filepath | Optional'
  )
  .option(
    '-m, --maxconcurrency <maxConcurrency>',
    'Maximum number of concurrent filestreams to process | Optional'
  )
  .option('-p, --params <params>', 'CsvToJson params | Optional')
  .action(cmd => {
    importScript.start(cmd);
  });

// Export
program
  .command('export')
  .alias('e')
  .description('Export the contents of an Algolia index to local JSON files')
  .option('-a, --algoliaappid <algoliaAppId>', 'Algolia app ID | Required')
  .option('-k, --algoliaapikey <algoliaApiKey>', 'Algolia API key | Required')
  .option(
    '-n, --algoliaindexname <algoliaIndexName>',
    'Algolia index name | Required'
  )
  .option('-o, --outputpath <outputPath>', 'Output filepath | Required')
  .option('-p, --params <params>', 'Algolia params | Optional')
  .action(cmd => {
    exportScript.start(cmd);
  });

// Get Settings
program
  .command('getsettings')
  .alias('g')
  .description('Get the settings of an Algolia index as JSON')
  .option('-a, --algoliaappid <algoliaAppId>', 'Algolia app ID | Required')
  .option('-k, --algoliaapikey <algoliaApiKey>', 'Algolia API key | Required')
  .option(
    '-n, --algoliaindexname <algoliaIndexName>',
    'Algolia index name | Required'
  )
  .action(cmd => {
    getSettingsScript.start(cmd);
  });

// Set Settings
program
  .command('setsettings')
  .alias('s')
  .description('Set the settings of an Algolia index from a JSON file')
  .option('-a, --algoliaappid <algoliaAppId>', 'Algolia app ID | Required')
  .option('-k, --algoliaapikey <algoliaApiKey>', 'Algolia API key | Required')
  .option(
    '-n, --algoliaindexname <algoliaIndexName>',
    'Algolia index name | Required'
  )
  .option('-s, --sourcefilepath <sourceFilepath>', 'Source filepath | Required')
  .action(cmd => {
    setSettingsScript.start(cmd);
  });

// Transfer Index
program
  .command('transferindex')
  .alias('ti')
  .description(
    'Duplicate the data and settings of an index from one Algolia App to another'
  )
  .option(
    '-a, --sourceAlgoliaAppId <algoliaAppId>',
    'Algolia app ID | Required'
  )
  .option(
    '-k, --sourceAlgoliaApiKey <algoliaApiKey>',
    'Algolia API key | Required'
  )
  .option(
    '-n, --sourceAlgoliaIndexName <algoliaIndexName>',
    'Algolia index name | Required'
  )
  .option(
    '-d, --destinationAlgoliaAppId <algoliaAppId>',
    'Algolia app ID | Required'
  )
  .option(
    '-y, --destinationAlgoliaApiKey <algoliaApiKey>',
    'Algolia API key | Required'
  )
  .option(
    '-i, --destinationIndexName <algoliaIndexName>',
    'Algolia index name | Optional'
  )
  .option(
    '-t, --transformationfilepath <transformationFilepath>',
    'Transformation filepath | Optional'
  )
  .action(cmd => {
    transferIndexScript.start(cmd);
  });

// Transfer Index Config
program
  .command('transferindexconfig')
  .alias('tig')
  .description(
    'Duplicate the settings, synonyms, and query rules of an index from one Algolia App to another'
  )
  .option(
    '-a, --sourceAlgoliaAppId <algoliaAppId>',
    'Algolia app ID | Required'
  )
  .option(
    '-k, --sourceAlgoliaApiKey <algoliaApiKey>',
    'Algolia API key | Required'
  )
  .option(
    '-n, --sourceAlgoliaIndexName <algoliaIndexName>',
    'Algolia index name | Required'
  )
  .option(
    '-d, --destinationAlgoliaAppId <algoliaAppId>',
    'Algolia app ID | Required'
  )
  .option(
    '-y, --destinationAlgoliaApiKey <algoliaApiKey>',
    'Algolia API key | Required'
  )
  .option(
    '-i, --destinationIndexName <algoliaIndexName>',
    'Algolia index name | Optional'
  )
  .option(
    '-p, --params <params>',
    'Algolia batchSynonyms and batchRules params | Optional'
  )
  .action(cmd => {
    transferIndexConfigScript.start(cmd);
  });

// Transform Lines
program
  .command('transformlines')
  .alias('tl')
  .description(
    'Apply a custom transformation to each line of a file saving output lines to a new file'
  )
  .option('-s, --sourcefilepath <sourceFilepath>', 'Source filepath | Required')
  .option('-o, --outputpath <outputPath>', 'Output filepath | Required')
  .option(
    '-t, --transformationfilepath <transformationFilepath>',
    'Transformation filepath | Optional'
  )
  .action(cmd => {
    transformLinesScript.start(cmd);
  });

// Default Command
program
  .command('*')
  .alias('default')
  .description('Default command if none input')
  .action(cmd => {
    defaultCommand(cmd);
  });

// LOGIC

// Process command
program.parse(process.argv);
// Register node process event listeners
registerDefaultProcessEventListeners();
// Handle no-command case
if (program.args.length === 0) noCommand();
