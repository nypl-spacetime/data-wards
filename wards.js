var fs = require('fs')
var path = require('path')
var H = require('highland')
var shp2json = require('shp2json')
var JSONStream = require('JSONStream')

function getFeatures (filename) {
  var years = filename.match(/(\d{4})/g)

  if (years.length === 1) {
    years = [years[0], years[0]]
  }

  var stream = fs.createReadStream(path.join(__dirname, 'shapefiles', filename))

  var features = shp2json(stream)
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
    type: 'pit',
    obj: {
      id: id,
      name: name,
      type: 'hg:Ward',
      validSince: feature.properties.validSince,
      validUntil: feature.properties.validUntil,
      geometry: feature.geometry
    }
  }
}

function transform (config, dirs, tools, callback) {
  var readdir = H.wrapCallback(fs.readdir)

  readdir(path.join(__dirname, 'shapefiles'))
    .flatten()
    .filter((f) => f.endsWith('zip'))
    .map(getFeatures)
    .flatten()
    .map(convertFeatures)
    .compact()
    .flatten()
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
