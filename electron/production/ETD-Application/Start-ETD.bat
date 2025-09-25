@echo off 
title ETD Application 
echo Starting ETD Application... 
npx electron . --no-sandbox --disable-web-security --disable-features=VizDisplayCompositor 
pause 
