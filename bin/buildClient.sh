#! /usr/bin/env bash
rm -rf ./dist/client
webpack --config ./node_modules/bhs-scripts/out/buildClient.js "${@}"
