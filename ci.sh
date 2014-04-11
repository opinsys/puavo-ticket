#!/bin/sh

set -eux

set

env

sudo apt-get update
sudo apt-get install nodejs-bundle build-essential git-core xvfb firefox chromium-browser -y --force-yes

Xvfb :99 -screen 0 1920x1080x24 &> /cirun/xvfb.log &
export DISPLAY=:99


# XXX: For some random reason ci user has no permissions to write
# /home/ci/.npmrc
# Workaround by using sudo.
sudo npm set registry http://registry.npmjs.org/

make
make test
