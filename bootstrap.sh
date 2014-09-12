#!/bin/sh

cd ~

sudo apt-get install -y python-software-properties git
sudo apt-add-repository ppa:rquillo/ansible --yes
sudo apt-get update
sudo apt-get install -y ansible

git clone https://github.com/opinsys/puavo-ticket.git
cd puavo-ticket
sudo ansible-playbook development-env.yml --extra-vars dev_user=$USER --extra-vars code_dest=$HOME
