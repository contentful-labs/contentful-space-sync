# Contentful Space Sync

[![npm](https://img.shields.io/npm/v/contentful-space-sync.svg)](https://www.npmjs.com/package/contentful-space-sync)
[![Build Status](https://travis-ci.org/contentful/contentful-space-sync.svg?branch=master)](https://travis-ci.org/contentful/contentful-space-sync)
[![Coverage Status](https://coveralls.io/repos/github/contentful/contentful-space-sync/badge.svg?branch=master)](https://coveralls.io/github/contentful/contentful-space-sync?branch=master)
[![Dependency Status](https://david-dm.org/contentful/contentful-space-sync.svg)](https://david-dm.org/contentful/contentful-space-sync)
[![devDependency Status](https://david-dm.org/contentful/contentful-space-sync/dev-status.svg)](https://david-dm.org/contentful/contentful-space-sync#info=devDependencies)

[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

This tool allows you to perform a **one way** synchronization from one Contentful space to another.

Assuming you have a source space and a destination space, you can keep **published** content synchronized over time. Any draft or unsaved content will not be synchronized.

Each time you run the tool it stores a [synchronization token](https://www.contentful.com/developers/docs/concepts/sync/) so only new Entries and Assets get copied, and so that deleted items can also be deleted on the destination space. See the [Synchronization](https://www.contentful.com/developers/docs/concepts/sync/) documentation for more details.

Content Types will always be updated as they are not retrieved by the synchronization API, and Content Types which don't exist anymore in the source space will be deleted in the destination space as well.

If you make any manual changes in the destination space, be aware that **this tool will overwrite any changes** you've made to entities with the same ids as those existent on the source space.

Also, avoid creating new Content Types and Entries in the destination space. This tool is intended to be used with a workflow where you create content on one space and then regularly copy it somewhere else in an automated way.

# Changelog

Check out the [releases](https://github.com/contentful/contentful-space-sync/releases) page.

# Install

`npm install -g contentful-space-sync`

# Usage

```
Usage: contentful-space-sync [options]

Options:
  --version                       Show version number

  --source-space                  ID of Space with source data
                                  [string] [required]

  --destination-space             ID of Space data will be copied to
                                  [string] [required]

  --source-delivery-token         Delivery API token for source space
                                  [string] [required]

  --management-token              Management API token for both spaces.
                                  [string]

  --source-management-token       Management API token for source space, if
                                  different from --management-token.
                                  [string]

  --destination-management-token  Management API token for destination space if
                                  different from --management-token.
                                  [string]

  --pre-publish-delay             Delay in milliseconds to account for delay
                                  after creating entities, due to internal
                                  database indexing
                                  [default: 5000]

  --fresh                         Ignores an existing sync token and syncs from
                                  the start
                                  [boolean]

  --sync-token-dir                Defines the path for storing sync token files
                                  (default path is the current directory)
                                  [string]

  --content-model-only            Copies only content types and locales
                                  [boolean]

  --skip-content-model            Skips content types and locales. Copies only entries and assets
                                  [boolean]

  --skip-locales                  Skips locales. Must be used with --content-model-only.
                                  Copies only content types.
                                  [boolean]

  --force-overwrite               Forces overwrite of content on the destination
                                  space with the same ID. BEFORE USING THIS
                                  option see the section "Overwriting Content"
                                  on the README for more details.
                                  [boolean]

  --config                        Configuration file with required values

```

The `--management-token` parameter allows you to specify a token which will be used for both spaces. If you get a token from https://www.contentful.com/developers/docs/references/authentication/ and your user account has access to both spaces, this should be enough.

In case you actually need a different management token for any of the spaces, you can use the `--source-management-token` and `--destination-management-token` options to override it.

Check the `example-config.json` file for an example of what a configuration file would look like. If you use the config file, you don't need to specify the other options for tokens and space ids.

# Example usage

```
contentful-space-sync \
  --source-space sourceSpaceId \
  --source-delivery-token sourceSpaceDeliveryToken \
  --destination-space destinationSpaceId \
  --destination-management-token destinationSpaceManagementToken
```

or

```
contentful-space-sync --config example-config.json
```

You can create your own config file based on the [`example-config.json`](example-config.json) file.

You can also use the `--fresh` parameter with any of the above combinations, in case you have manually deleted all content from an existent space and want to ignore an existing stored sync token.

# Synchronizing a space over time

This tool uses the Contentful [Synchronization](https://www.contentful.com/developers/docs/concepts/sync/) endpoint to keep content synchronized over repeated runs of the script.

Behind the scenes, when you use the sync endpoint, apart from the content it also returns a sync token in its response. The sync token encodes information about the last synchronized content, so that when you request a new synchronization, you can supply it this content and you'll only get new and updated content, as well a list of what content has been deleted.

When you run this tool, it will create a file in the current directory named `contentful-space-sync-token-sourceSpaceId-destinationSpaceId`. If you run the tool again in the directory where this file resides, with the same source and destination space IDs, it will read the token from the file. If you have a token from somewhere else you can just create the file manually.

# The error log

If any errors occur during synchronization, the tool will also create a time stamped log file (`contentful-space-sync-timestamp.log`) with a list of any errors which occurred, and links to the entities in the source space which might have problems that need to be fixed.

The most common problem will probably be an `UnresolvedLinks` error, which means a published entry A links to another entry B or asset C which has been deleted since publishing of the entry A.

If you come across this problem, you can use [contentful-link-cleaner](https://github.com/contentful/contentful-link-cleaner) to clean all of those unresolved references.

# Overwriting content

On some occasions, an initial sync might fail with an unexpected error and you'd like to resume it.

An initial sync will always fail if content already exists in the destination space.

There are various reasons for this but the main one is that while entries and assets can be retrieved through the sync API, as well as deleted entries and assets, for Content Types and Locales the tool always retrieves all the Content Types and all the Locales in the source and destination spaces, compares them, and in the destination space deletes the ones that don't exist in the source space.

For this reason we don't overwrite content by default when attempting a sync on a fresh space. If you'd like to still do it, you can use the `--force-overwrite` option.

When using this option, all the entities on the destination space with the same ID as the ones on the source space will be overwritten. On subsequent syncs, any Content Types and Locales that don't exist on the source space will be deleted.

# Copying only the content model

By using the `--content-model-only` option, you can copy only Content Types and Locales. This means you'll get a space with the same content structure, but with no content at all.

This might be useful if you have been trying things out but want to start fresh with your content, or if you have a need to [delete fields](#deleting-fields) from your existing Content Types.

# Copying only content

By using the `--skip-content-model` option, you can copy only Entries and Assets. This assumes you have used this script before with the `--content-model-only` option or created the exact same content structure by hand.

Every time you run the script without any of these options, it will attempt to update the content model as well, so on subsequent syncs it might be desirable to use this option to make things a bit faster.

# Deleting fields

At the moment, there is a limitation in Contentful regarding field deletion. If you create a Content Type and then create some entries based on it, you are unable to delete fields as the content structure of entries would be changed.

By using a combination of `--content-model-only` and `--skip-content-model`, you can remove fields from content types and ensure that all the entries based on these content types are properly transformed.

## Step 1

Create a new space for use as a destination space, and run the script with the option `--content-model-only`

## Step 2

Using the Contentful user interface or the API, remove the fields you wish to get rid off from your Content Types.

## Step 3

Run the script again, this time with the option `--skip-content-model`.

Every time you synchronize content in the future from the source space, you should also use this option as the source space will still have the fields that have been removed.
