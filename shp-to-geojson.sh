#! /bin/bash

rm -rf geojson
mkdir geojson
unzip "shapefiles/*.zip" -d temp >> /dev/null

for shapefile in ./temp/*.shp
do
  filename=$(basename "$shapefile")
  extension="${filename##*.}"
  filename="${filename%.*}"

  # echo "./geojson/$filename.geojson $shapefile"
  ogr2ogr -f GeoJSON -t_srs crs:84 ./geojson/$filename.geojson $shapefile
done

rm -rf temp
