import Promise from 'bluebird'
import log from 'npmlog'
import fs from 'fs'
Promise.promisifyAll(fs)

import {find, filter} from 'lodash/collection'

import createClients from './create-clients'
import getTransformedDestinationResponse from './get-transformed-destination-response'
import dumpErrorBuffer from './dump-error-buffer'
import getSourceSpace from './get/get-source-space'
import transformSpace from './transform/transform-space'
import pushToSpace from './push/push-to-space'

export default function runSpaceSync (usage) {
  const {opts, syncTokenFile, errorLogFile} = usage
  const clients = createClients(opts)
  return getSourceSpace(clients.source.delivery, clients.source.management, clients.source.spaceId, syncTokenFile, opts.fresh)

  // Prepare object with both source and destination existing content
  .then(sourceResponse => {
    return Promise.props({
      source: sourceResponse,
      destination: getTransformedDestinationResponse(
        clients.destination.management,
        clients.destination.spaceId,
        sourceResponse,
        {
          forceOverwrite: opts.forceOverwrite,
          skipContentModel: opts.skipContentModel
        }
      )
    })
  })
  .then(responses => {
    return Promise.props({
      source: transformSpace(responses.source, responses.destination),
      destination: responses.destination
    })
  })

  // Get deleted content types
  .then(responses => {
    responses.source.deletedContentTypes = filter(responses.destination.contentTypes, contentType => {
      return !find(responses.source.contentTypes, 'original.sys.id', contentType.sys.id)
    })
    responses.source.deletedLocales = filter(responses.destination.locales, locale => {
      return !find(responses.source.locales, 'original.code', locale.code)
    })
    return responses
  })

  // push source space content to destination space
  .then(responses => {
    return pushToSpace(
      responses,
      clients.destination.management,
      clients.destination.spaceId,
      {
        prePublishDelay: opts.prePublishDelay,
        contentModelOnly: opts.contentModelOnly,
        skipContentModel: opts.skipContentModel
      }
    )
    .then(() => {
      const nextSyncToken = responses.source.nextSyncToken
      if (!opts.contentModelOnly) {
        fs.writeFileSync(syncTokenFile, nextSyncToken)
        log.show('Successfully sychronized the content and saved the sync token to:\n ', syncTokenFile)
      } else {
        log.show('Successfully sychronized the content model')
      }
      dumpErrorBuffer({
        destinationSpace: opts.destinationSpace,
        sourceSpace: opts.sourceSpace,
        errorLogFile: errorLogFile
      }, 'However, additional errors were found')
    })
  })

  // Output any errors caught along the way
  .catch(err => {
    dumpErrorBuffer({
      destinationSpace: opts.destinationSpace,
      sourceSpace: opts.sourceSpace,
      errorLogFile: errorLogFile
    })
    throw err
  })
}
