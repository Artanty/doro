# doro

cd web
npm run start
===
v1.0.0
build back from ts to js
choose server or service
deploy
===
v0.1.1
todo:
add jest for tests;
write simple test: eventList displays events;
===
v0.1.0
todo:
make minimal viable version: build eventList from config ui, play it;
add unsubscribe on destroy;
display and highlight 00:00 on ended event in eventList until next is played;
+ fix tab change bug, move nav-component to wrapper
scroll to current event in event-list on enter
back: set created schedule as current
web: support load created schedule & events (all clients)
===
v0.0.6
finish config ui:
- work length
- rest length
- big rest length
- big rest length every n cicles
save it as new schedule;
display left time of paused event in eventList;
===
v0.1.1
todo:
add jest for tests;
write simple test: eventList displays events;
===
v0.1.0
todo:
make minimal viable version: build eventList from config ui, play it;
===
v0.0.6
todo:
finish config ui:
- work length
- rest length
- big rest length
- big rest length evenry n cicles
save it as new schedule;
add unsubscribe on destroy;
display and highlight 00:00 on ended event in eventList until next is played;
display left time of paused event in eventList;
===
v0.0.5
fix display playing event in eventList after end-event-screen;
display seconds progress in eventList;
display seconds progress in eventList;
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
todo:
todo:
+default schedule setting v0.2.0
+playEventFromStart (reset current) in timer view v0.2.0
+delete current event in timer view v0.2.0
+"delete current event" (default off) setting v0.2.0
+time unit displayed in timer (default: seconds) setting v0.3.0
fix current event: make back source of truth;
remove advanced logic from tick api;
fix current event: make back source of truth;
remove advanced logic from tick api;

===
xz:
add flag to store? - events loaded
