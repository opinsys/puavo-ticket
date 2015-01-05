#!/bin/sh

set -eux

export HOME=/home/ci ## fix home for now
export DISPLAY=:99
export NODE_ENV=test

sudo apt-get update
sudo apt-get install -y wget make

# Apply puavo-standalone Ansible rules
wget -qO - https://github.com/opinsys/puavo-standalone/raw/master/setup.sh | sudo sh

# Install build dependencies
sudo make install-build-dep

# XXX: For some random reason ci user has no permissions to write
# /home/ci/.npmrc
# Workaround by using sudo.
sudo npm set registry http://registry.npmjs.org/

# Build debian package
make deb

# Upload it to archive.opinsys.fi
# aptirepo-upload -r $APTIREPO_REMOTE -b "git-$(echo "$GIT_BRANCH" | cut -d / -f 2)" ../puavo-ticket*.changes
