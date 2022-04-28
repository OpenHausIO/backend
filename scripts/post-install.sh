#!/bin/bash

pwd=$(pwd);

#echo $pwd/scripts/hooks/;
# rm -rf $pwd/.git/hooks
# https://rjzaworski.com/2018/01/keeping-git-hooks-in-sync
if [[ ! -d $pwd/.git/hooks ]]
then
    ln -s $pwd/scripts/hooks/ $pwd/.git/
fi