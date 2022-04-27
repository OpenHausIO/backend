#!/bin/bash

pwd=$(pwd);

#echo $pwd/scripts/hooks/;
if [[ ! -d $pwd/.git/hooks ]]
then
    ln -s $pwd/scripts/hooks/ $pwd/.git/
fi