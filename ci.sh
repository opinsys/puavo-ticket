#!/bin/sh

set -eux

set

env

## fix home for now
export HOME=/home/ci

sudo apt-get update
make install-ansible
make dev-install

Xvfb :99 -screen 0 1920x1080x24 &> /cirun/xvfb.log &
export DISPLAY=:99


# XXX: For some random reason ci user has no permissions to write
# /home/ci/.npmrc
# Workaround by using sudo.
sudo npm set registry http://registry.npmjs.org/

export NODE_ENV=test
make
make migrate
make test
