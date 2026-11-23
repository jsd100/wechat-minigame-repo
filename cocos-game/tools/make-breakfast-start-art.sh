#!/usr/bin/env bash
set -euo pipefail

project_dir=$(cd "$(dirname "$0")/.." && pwd)
art_dir="$project_dir/extensions/breakfast-startup"
output="$art_dir/breakfast-start.jpg"
title=${1:-早点凑一单}
display_font=${BREAKFAST_DISPLAY_FONT:-/System/Library/Fonts/Supplemental/Songti.ttc}
body_font=${BREAKFAST_BODY_FONT:-/System/Library/Fonts/Hiragino Sans GB.ttc}
magick "$art_dir/breakfast-start-art.jpg" -gravity center -resize '720x1280^' -extent 720x1280 \
    -fill '#062c2466' -stroke none -draw 'roundrectangle 90,203 630,388 41,41' \
    -stroke '#704429' -strokewidth 9 -draw 'line 201,77 201,231 line 519,77 519,231' \
    -stroke '#be8c53' -strokewidth 2 -draw 'line 199,77 199,231 line 517,77 517,231' \
    -fill '#073d37' -stroke '#073d37' -strokewidth 3 -draw 'roundrectangle 98,202 622,374 38,38' \
    -fill '#117464' -stroke '#afd1ad' -strokewidth 3 -draw 'roundrectangle 98,192 622,364 38,38' \
    -fill '#ffedc5' -stroke '#cf9859' -strokewidth 4 -draw 'roundrectangle 115,208 605,347 26,26' \
    -fill none -stroke '#c18455' -strokewidth 2 -draw 'roundrectangle 126,219 594,336 20,20' \
    -fill '#cc8e52' -stroke '#804831' -strokewidth 2 -draw 'circle 201,206 201,213 circle 519,206 519,213' \
    -font "$display_font" -pointsize 75 -fill '#8a3826' -stroke '#8a3826' -strokewidth 1.3 \
    -annotate +0-362 "$title" \
    -font "$body_font" -pointsize 27 -fill '#fff1ce' -stroke none -annotate +0+456 '正在开摊…' \
    -colorspace sRGB -sampling-factor 4:2:0 -strip -quality 84 "$output"

printf '%s\n' "$output"
