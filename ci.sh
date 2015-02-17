#!/bin/sh

set -eux

export DISPLAY=:99
export NODE_ENV=test

ls -la /

sudo apt-get update
sudo apt-get install -y wget make devscripts git

# Apply puavo-standalone Ansible rules
wget -qO - https://github.com/opinsys/puavo-standalone/raw/master/setup.sh | sudo sh

# Install build dependencies
sudo make install-build-dep

# Fix /tmp/babel.json permission issue
sudo stop puavo-ticket
sudo rm -f /tmp/babel.json

# Build debian package
make deb

cp ../puavo-ticket_* $HOME/results
