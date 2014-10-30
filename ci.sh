#!/bin/sh

set -eux

set

env

## fix home for now
export HOME=/home/ci

sudo apt-get update
sudo apt-get install -y --force-yes aptirepo-upload puavo-devscripts wget

export DISPLAY=:99

# XXX: For some random reason ci user has no permissions to write
# /home/ci/.npmrc
# Workaround by using sudo.
sudo npm set registry http://registry.npmjs.org/

export NODE_ENV=test

wget -qO - https://github.com/opinsys/puavo-standalone/raw/master/setup.sh | sudo sh

sudo make install-build-dep
make deb

aptirepo-upload -r $APTIREPO_REMOTE -b "git-$(echo "$GIT_BRANCH" | cut -d / -f 2)" ../puavo-ticket*.changes
