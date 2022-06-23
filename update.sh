#!/bin/bash

cd /Users/charleskoehl/Documents/Work/captainwoo/nalula/nalula-site-api || exit
echo "get latest"
git pull
echo "install"
yarn
echo "restarting"
pm2 restart server
