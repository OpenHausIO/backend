#!/usr/bin/env sh

#echo $pwd/scripts/hooks/;
# rm -rf $pwd/.git/hooks
# https://rjzaworski.com/2018/01/keeping-git-hooks-in-sync
#rm -rf $(pwd)/.git/hooks
#ln -s $(pwd)/scripts/hooks $(pwd)/.git/

if [ "$NODE_ENV" = "production" ]; then

    # production installation
    # sudo cp ../backend.service /usr/lib/systemd/system/
    # sudo systemctl daemon-reload

    # the true is needed, because a empty if/else block
    # throw in the shell a error
    true

else

    # test/development installation
    npx husky install

fi