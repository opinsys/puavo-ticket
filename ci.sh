#!/bin/sh

set -eux

set

env

## fix home for now
export HOME=/home/ci


sudo apt-get install software-properties-common
sudo apt-add-repository ppa:rquillo/ansible --yes
sudo apt-get update
sudo apt-get install -y ansible
ansible-playbook development-env.yml

Xvfb :99 -screen 0 1920x1080x24 &> /cirun/xvfb.log &
export DISPLAY=:99


# XXX: For some random reason ci user has no permissions to write
# /home/ci/.npmrc
# Workaround by using sudo.
sudo npm set registry http://registry.npmjs.org/

make
make test
