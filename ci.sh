#!/bin/sh

set -eux

sudo apt-get update
sudo apt-get install nodejs-bundle build-essential git-core xvfb firefox chromium-browser -y --force-yes

Xvfb :99 -screen 0 1920x1080x24 &> /cirun/xvfb.log &
export DISPLAY=:99

make
make test
