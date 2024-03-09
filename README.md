# doro

cd web

npm run start

===
09.03.2024 
widget: timer view 

available actions:
- play
- pause
- playNext

ui displays: 
- current action (name in v1.1.0)
- state of current action (playing, paused, stopped)
- progress every time unit (default: seconds - hardcoded v1.1.0)
- what event is next

states:
- no events in schedule - create default schedule events in current schedule on click "play" and play first of em
- no next event - create one of events on click "playNext", select from defaults, list sorted starting from diff. event from the last or playing
- normal mode - current event is set, next event is set. current event can be playing, paused or stopped
- when event is ended we must play next or make another desicion - show "end-event-screen"
===
+default schedule setting v1.2.0
+playEventFromStart (reset current) in timer view v1.2.0
+delete current event in timer view v1.2.0
+"delete current event" (default off) setting v1.2.0
+time unit displayed in timer (default: seconds) setting v1.3.0
