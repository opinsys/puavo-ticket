#!/bin/sh

set -eux

sudo apt-get install nodejs-bundle build-essential -y --force-yes
make
make test
