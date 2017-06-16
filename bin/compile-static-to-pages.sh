#!/bin/bash
# This script can be used to build a static version of the currently compiled site to an embedded gh-pages directory.

clear

printf "\e[36mStarting static site compilation.\e[39m\n";

if [ ! -d ".static" ]; then
	printf "\e[31mThere is no .static directory.\nEnsure you are in the root of your project.\nIf you're already there, run the server at least once and try again.\e[39m\n"
	exit 1;
fi;


# check if the repo is setup w/ a github remote. best way to determine if this is a version of ships, for now
if ! git remote show github > /dev/null 2>&1; then
	while true; do
		read -p $'\e[35mYou don\'t appear to be inside of a git repository, and are probably not in the right directory to run this.\nAre you sure you want to continue? (Y/n)\e[39m\n' yn
		case $yn in
			[Yy]* ) break;;
			[Nn]* ) exit;;
			* ) printf "\e[31mPlease answer yes or no.\e[39m\n";;
		esac
	done
fi;

# check if the github.io repo exists, offer to get it if not. Exit if the offer is declined.
if [ ! -d "gh-pages" ]; then
	while true; do
		read -p $'\e[35mThere is no gh-pages branch repo to compile to, do you want to check it out? (The script will exit if you decline) (Y/n)\e[39m\n' yn
		case $yn in
			[Yy]* )
				printf "\e[33mRunning: \`git clone git@github.com:nstolpe/ships.git --branch gh-pages --single-branch gh-pages\`\e[39m\n";
				git clone git@github.com:nstolpe/ships.git --branch gh-pages --single-branch gh-pages;
				printf "\e[36mClone complete\e[39m\n";
				break;;
			[Nn]* )
				printf "\e[36mExiting...\e[39m\n";
				exit;;
			* ) printf "\e[31mPlease answer yes or no.\e[39m\n";;
		esac
	done
fi;

# copy static assets into the pages repo
printf "\e[36mCopying static assets...\e[39m\n";
printf "\e[33mRunning: \`cp -rv .static/assets/* gh-pages/assets/\`\e[39m\n";
cp -rv .static/assets/* gh-pages/assets/
printf "\e[36mCopying static assets complete.\e[39m\n";

# make static copies of all available views 

page_errors=0
for filename in server/views/*.hbs; do
	name=$(basename "$filename" .hbs);
	printf "\e[33mRunning: \`wget http://localhost:2400/$name -O $name.html\`\e[39m\n"
	cd gh-pages && wget -q http://localhost:2400/"$name" -O "$name".html
	if [ $? -ne 0 ]; then
		page_errors=$((page_errors+1))
		printf "\e[35mFailed to create $name.html in pages repo.\e[39m\n";
	fi;
	cd ../
done;

while true; do
	if [ page_errors -gt  0 ]; then
		read -p $'\e[36mCompilation has completed, \e[33mbut not all page templates were successfully compiled. Do you want to push the pages repository? (Y/n)\e[39m\n' yn
	else
		read -p $'\e[36mCompilation has completed. Do you want to push the pages repository? (Y/n)\e[39m\n' yn
	fi

	case $yn in
		[Yy]* )
			cd gh-pages &&
			printf "\e[33mRunning: \`git clone git@github.com:nstolpe/ships.git --branch gh-pages --single-branch gh-pages\`\e[39m\n"
			git add .
			date_stamp=$(date +'%Y-%m-%d %H:%M:%S')
			git commit -m "Autobuild: $date_stamp"
			git push origin gh-pages
			printf "\e[36mPush complete\e[39m\n"
			break;;
		[Nn]* )
			printf "\e[36mExiting...\e[39m\n"
			exit;;
		* ) printf "\e[31mPlease answer yes or no.\e[39m\n";;
	esac
done

