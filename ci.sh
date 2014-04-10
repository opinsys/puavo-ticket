#!/bin/sh

set -eux

sudo apt-get update
sudo apt-get install nodejs-bundle build-essential git-core -y --force-yes

make
make test
