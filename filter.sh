#!/bin/bash
git filter-branch -f --env-filter '
OLD_EMAIL="lautarofaccini@gmail.com"
CORRECT_NAME="bludepeca"
CORRECT_EMAIL="bludepeca@users.noreply.github.com"

if [ "$GIT_COMMITTER_EMAIL" = "$OLD_EMAIL" ]
then
    export GIT_COMMITTER_NAME="$CORRECT_NAME"
    export GIT_COMMITTER_EMAIL="$CORRECT_EMAIL"
fi
if [ "$GIT_AUTHOR_EMAIL" = "$OLD_EMAIL" ]
then
    export GIT_AUTHOR_NAME="$CORRECT_NAME"
    export GIT_AUTHOR_EMAIL="$CORRECT_EMAIL"
fi
' --tag-name-filter cat -- --branches --tags

git filter-branch -f --msg-filter '
    sed -e "s/lautarofaccini/bludepeca/g" -e "s/Lautaro/bludepeca/g"
' --tag-name-filter cat -- --branches --tags
