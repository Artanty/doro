# doro

cd web
npm run start


v0.0.5
todo:
fix current event: make back source of truth;
remove advanced logic from tick api;
fix display playing event in eventList after end-event-screen;
===
v0.0.4
make end-event-screen with next event suggestion;
add event templates to locaStorage;
===
v0.0.3
todo:
display actual passed time of event when it paused in counter view;
finish CreateEventsAndPlay in counter;
===
v0.0.2
todo: 
fix remove current event from store when it's removed from event list. check in counter widget.
fix remove current event from db when it's removed from event list
===
v0.0.1
widget: timer view 

available actions:
- play
- pause
- playNext

ui displays: 
- current action (name in v0.1.0)
- state of current action (playing, paused, stopped)
- progress every time unit (default: seconds - hardcoded v0.1.0)
- what event is next

states:
- no events in schedule - create default schedule events in current schedule on click "play" and play first of em
- no next event - create one of events on click "playNext", select from defaults, list sorted starting from diff. event from the last or playing
- normal mode - current event is set, next event is set. current event can be playing, paused or stopped
- when event is ended we must play next or make another desicion - show "end-event-screen"

===
+default schedule setting v0.2.0
+playEventFromStart (reset current) in timer view v0.2.0
+delete current event in timer view v0.2.0
+"delete current event" (default off) setting v0.2.0
+time unit displayed in timer (default: seconds) setting v0.3.0

===
xz:
add flag to store? - events loaded
