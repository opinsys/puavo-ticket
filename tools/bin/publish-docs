#!/bin/sh
set -eux

rm doc/.git -rf

make doc

git log -1 > doc/version.txt

cd doc

if [ "$(git config user.email)" = "" ]; then
    git config --global user.email "dev@opinsys.fi"
    git config --global user.name "Opinsys developers"
fi

git init .
git add .
git commit -m "commit docs"
git push -f git@github.com:opinsys/puavo-ticket.git master:gh-pages
