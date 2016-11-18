var yargs = require('yargs')
var log = require('npmlog')
var packageFile = require('../package')

var opts = yargs
  .version(packageFile.version || 'Version only available on installed package')
  .usage('Usage: $0 [options]')
  .option('source-space', {
    describe: 'ID of Space with source data',
    type: 'string',
    demand: true
  })
  .option('destination-space', {
    describe: 'ID of Space data will be copied to',
    type: 'string',
    demand: true
  })
  .option('rate-limit', {
    describe: 'How many requests to perform per period of time, default is 6',
    type: 'number',
    default: 6
  })
  .option('rate-limit-period', {
    describe: 'How much time to wait before retry in ms, default 1000',
    type: 'number',
    default: 1000
  })
  .option('source-delivery-token', {
    describe: 'Delivery API token for source space',
    type: 'string',
    demand: true
  })
  .option('management-token', {
    describe: 'Management API token for both spaces.',
    type: 'string'
  })
  .option('source-management-token', {
    describe: 'Management API token for source space, if different from --management-token.',
    type: 'string'
  })
  .option('destination-management-token', {
    describe: 'Management API token for destination space if different from --management-token.',
    type: 'string'
  })
  .option('pre-publish-delay', {
    describe: 'Delay in milliseconds to account for delay after creating entities, due to internal database indexing',
    type: 'number',
    default: 5000
  })
  .option('sync-token-dir', {
    describe: 'Defines the path for storing sync token files (default path is the current directory)',
    type: 'string'
  })
  .option('content-model-only', {
    describe: 'Copies only content types and locales',
    type: 'boolean'
  })
  .option('skip-content-model', {
    describe: 'Skips content types and locales. Copies only entries and assets',
    type: 'boolean'
  })
  .option('skip-locales', {
    describe: 'Skips locales. Must be used with content-model-only. Copies only content-types',
    type: 'boolean'
  })
  .option('delivery-host', {
    describe: 'Host for the Delivery API.',
    type: 'string'
  })
  .option('delivery-port', {
    describe: 'Port for the Delivery API.',
    type: 'string'
  })
  .option('delivery-insecure', {
    describe: 'If the Delivery API should use http instead of the default https.',
    type: 'boolean'
  })
  .option('management-host', {
    describe: 'Host for the Management API.',
    type: 'string'
  })
  .option('management-port', {
    describe: 'Port for the Management API.',
    type: 'string'
  })
  .option('management-insecure', {
    describe: 'If the Management API should use http instead of the default https.',
    type: 'boolean'
  })
  .option('proxy-host', {
    describe: 'hostname of the proxy server',
    type: 'string'
  })
  .option('proxy-port', {
    describe: 'port of the proxy server',
    type: 'string'
  })
  .config('config', 'Configuration file with required values')
  .check(function (argv) {
    if (!argv.proxyHost && !argv.proxyPort) {
      return true
    }
    if (argv.proxyPort && argv.proxyHost) {
      return true
    }
    log.error('--proxy-host and --proxy-port must be both defined')
    process.exit(1)
  })
  .check(function (argv) {
    if (!argv.sourceManagementToken &&
      !argv.destinationManagementToken &&
      argv.managementToken) {
      return true
    }
    if (argv.sourceManagementToken &&
      argv.destinationManagementToken &&
      !argv.managementToken) {
      return true
    }
    if ((!argv.sourceManagementToken ||
      !argv.destinationManagementToken) &&
      argv.managementToken) {
      return true
    }
    log.error(
      'Please provide a --management-token to be used for both source and delivery\n' +
      'spaces, or separate --source-management-token and --delivery-management-token.\n' +
      '\n' +
      'You also provide --management-token and use just one of the other options to\n' +
      'override it.\n' +
      '\n' +
      'See https://www.npmjs.com/package/contentful-space-sync for more information.\n'
    )
    process.exit(1)
  })
  .check(function (argv) {
    if (argv.skipContentModel && argv.contentModelOnly) {
      log.error('--skipContentModel and --contentModelOnly cannot be used together')
      process.exit(1)
    }
    return true
  })
  .check(function (argv) {
    if (argv.skipLocales && !argv.contentModelOnly) {
      log.error('--skip-locales can only be used with --content-model-only')
      process.exit(1)
    }
    return true
  })
  .argv

module.exports = {
  opts: opts
}
