#!/bin/sh

set -eux

export DISPLAY=:99
export NODE_ENV=test
export BABEL_DISABLE_CACHE=1

sudo apt-get update
sudo apt-get install -y wget make devscripts git

# Apply puavo-standalone Ansible rules
wget -qO - https://github.com/opinsys/puavo-standalone/raw/master/setup.sh | sudo sh

# Install build dependencies
sudo make install-build-dep

# Build debian package
make deb

cp ../puavo-ticket_* $HOME/results
