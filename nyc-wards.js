var fs = require('fs')
var path = require('path')
var H = require('highland')
var JSONStream = require('JSONStream')
const rewind = require('geojson-rewind')

function getFeatures (filename) {
  var years = filename.match(/(\d{4})/g)

  if (years.length === 1) {
    years = [years[0], years[0]]
  }

  var features = fs.createReadStream(path.join(__dirname, 'geojson', filename))
    .pipe(JSONStream.parse('features.*'))

  return H(features)
    .map((feature) => {
      feature.properties.validSince = parseInt(years[0])
      feature.properties.validUntil = parseInt(years[1])
      return feature
    })
}

function convertFeatures (feature) {
  var name = feature.properties.Ward

  var id = [
    feature.properties.validSince,
    feature.properties.validUntil,
    name.toLowerCase()
  ].join('-')

  return {
    type: 'object',
    obj: {
      id: id,
      name: name,
      type: 'st:Ward',
      validSince: feature.properties.validSince,
      validUntil: feature.properties.validUntil,
      geometry: rewind(feature.geometry, false)
    }
  }
}

function transform (config, dirs, tools, callback) {
  var readdir = H.wrapCallback(fs.readdir)

  readdir(path.join(__dirname, 'geojson'))
    .flatten()
    .map(getFeatures)
    .flatten()
    .compact()
    .map(convertFeatures)
    .flatten()
    .compact()
    .map(H.curry(tools.writer.writeObject))
    .nfcall([])
    .series()
    .stopOnError(callback)
    .done(callback)
}

// ==================================== API ====================================

module.exports.steps = [
  transform
]
