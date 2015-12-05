while true
do
inotifywait -e modify /home/pi/node-sonos-http-api-master/presets.json && bash  /home/pi/pi-restart.sh
done
