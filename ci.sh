#!/bin/sh

set -eux

set

env

## fix home for now
export HOME=/home/ci

sudo apt-get update
sudo make install-ansible
sudo ansible-playbook development-env.yml --extra-vars dev_user=$USER --extra-vars code_dest=/cirun --extra-vars archive_server=new-archive.opinsys.fi

export DISPLAY=:99

# XXX: For some random reason ci user has no permissions to write
# /home/ci/.npmrc
# Workaround by using sudo.
sudo npm set registry http://registry.npmjs.org/

export NODE_ENV=test


puavo-build-debian-dir
puavo-dch 0.1.0
dpkg-buildpackage -us -uc

aptirepo-upload -r $APTIREPO_REMOTE -b "git-$(echo "$GIT_BRANCH" | cut -d / -f 2)" ../puavo-ticket*.changes
