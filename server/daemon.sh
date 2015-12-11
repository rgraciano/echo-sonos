while true
do
inotifywait -e modify /[dir]/[to]/node-sonos-http-api-master/presets.json && bash  /[dir]/[to]/restart.sh
done
