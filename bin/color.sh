#!/bin/bash

BLACK="\e[30m"
D_GREY="\e[90m"
L_GREY="\e[37m"
WHITE="\e[97m"
BLUE="\e[34m"
L_BLUE="\e[94m"
GREEN="\e[32m"
L_GREEN="\e[92m"
RED="\e[31m"
L_RED="\e[91m"
CYAN="\e[36m"
L_CYAN="\e[96m"
MAGENTA="\e[35m"
L_MAGENTA="\e[95m"
YELLOW="\e[33m"
L_YELLOW="\e[93m"
NONE="\e[39m"

case $2 in
    "black"|"blk")
        COLOR="$BLACK"
        ;;
    "darkgray"|"darkgrey"|"dark gray"|"dark grey"|"d grey"|"d gray"|"gd"|"dgrey"|"dgray")
        COLOR="$D_GREY"
        ;;
    "lightgray"|"lightgrey"|"light gray"|"light grey"|"l grey"|"l gray"|"gl"|"lgray"|"lgrey")
        COLOR="$L_GREY"
        ;;
    "white"|"wht"|"w")
        COLOR="$WHITE"
        ;;
    "blue"|"blu"|"b")
        COLOR="$BLUE"
        ;;
    "light blue"|"l blue"|"lb"|"lightblue"|"lblue")
        COLOR="$L_BLUE"
        ;;
    "green"|"grn"|"gr"|"g")
        COLOR="$GREEN"
        ;;
    "light green"|"lightgreen"|"lg"|"l green"|"lgreen")
        COLOR="$L_GREEN"
        ;;
    "red"|"r")
        COLOR="$RED"
        ;;
    "lightred"|"light red"|"lr"|"lred"|"l red")
        COLOR="$L_RED"
        ;;
    "cyan"|"c")
        COLOR="$CYAN"
        ;;
    "lightcyan"|"light cyan"|"lcyan"|"l cyan"|"lc")
        COLOR="$L_CYAN"
        ;;
    "magenta"|"m"|"mgn"|"mgnt"|"mag")
        COLOR="$MAGENTA"
        ;;
    "lightmagenta"|"light magenta"|"lm"|"lmgn"|"lmgnt"|"lmag")
        COLOR="$L_MAGENTA"
        ;;
    "yellow"|"y"|"yel"|"ylw")
        COLOR="$YELLOW"
        ;;
    "lightyellow"|"light yellow"|"ly"|"lyel"|"lylw")
        COLOR="$L_YELLOW"
        ;;
    *)
        COLOR="$NONE"
        ;;
esac;
printf "$COLOR$1$NONE\n"
