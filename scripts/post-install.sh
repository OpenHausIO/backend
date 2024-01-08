#!/bin/bash

#echo $pwd/scripts/hooks/;
# rm -rf $pwd/.git/hooks
# https://rjzaworski.com/2018/01/keeping-git-hooks-in-sync
rm -rf $(pwd)/.git/hooks
ln -s $(pwd)/scripts/hooks $(pwd)/.git/