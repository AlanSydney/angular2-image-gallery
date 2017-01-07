#!bin/bash

set -eux

rm -rf publish

node node_modules/typescript/bin/tsc --project src --outDir publish

rm -r publish/environments
rm -r publish/app/demo
rm publish/main.d.ts
rm publish/main.js
rm publish/main.js.map
rm publish/test.d.ts
rm publish/test.js
rm publish/test.js.map
rm publish/app/**/**.spec.**
rm publish/polyfills.d.ts
rm publish/polyfills.js

cp package.json publish/
cp config/convert.js publish/
cp config/angular2imagegallery.module.ts publish/app
cp src/app/gallery/gallery.component.html publish/app/gallery
cp src/app/viewer/viewer.component.html publish/app/viewer
cp src/app/gallery/gallery.component.css publish/app/gallery
cp src/app/viewer/viewer.component.css publish/app/viewer

node_modules/.bin/ng2-inline.cmd -o . -b publish/app/viewer publish/app/viewer/*.js
node_modules/.bin/ng2-inline.cmd -o . -b publish/app/gallery publish/app/gallery/*.js

rm publish/app/gallery/gallery.component.html
rm publish/app/viewer/viewer.component.html
rm publish/app/gallery/gallery.component.css
rm publish/app/viewer/viewer.component.css