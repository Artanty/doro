# doro v.2
what:
pomodoro timer
how works:
- has db of timer events
- on start subscribes to pool from tik@back
- to stop - apdate pool config
- pool ID = app@ + feature + id

получение состояния.
лист-компонент:
на старте идет запрос в свою дб event-state/list-by-user
который забирает конфиги событий пользователя.
Если есть события, таймер которых тикает,
0=inactive, 1=active, 2=paused -> т е "1"
то подписываемся на эти события.
В doro@ у пользователя в один момент активно одно событие.
плюс шаредные события. v2.1 при появлении более обного активного события у одного пользователя - нужно их смержить в единую подписку.

todo:
- remove build logic

# doro v.1 discontinued
===
to run back use node v.18
===
todo:
add jest for tests;
write simple test: eventList displays events;
implement job queue pattern with datatabase transactions
===
todo:
make minimal viable version: build eventList from config ui, play it;
add unsubscribe on destroy;
display and highlight 00:00 on ended event in eventList until next is played;
scroll to current event in event-list on enter
back: set created schedule as current
web: support load created schedule & events (all clients)
web: change schedule update logic;
display left time of paused event in eventList;
===
todo:
think, how to concatenate web & nack versions in one?
сбрасывать стор, когда отключается SSE
change createAndPlay respose to sse, move play to back;
web: remove setCurrentScheduleEvent, get from config;
fix remove event From event list.
create auth app, change init logic
===
v0.0.8 - 1.0.11
- build: deploy script wip;
===
v0.0.7
display current schedule name & id in eventList & counter views;
back: change schedule & events update logic;
web: change schedule & events update logic;
change removeEvent response to sse
===
v0.0.6
fix tab change bug, move nav-component to wrapper
finish config ui:
- work length
- rest length
- big rest length
- big rest length every n cicles
save it as new schedule;
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
+default schedule setting v0.2.0
+playEventFromStart (reset current) in timer view v0.2.0
+delete current event in timer view v0.2.0
+"delete current event" (default off) setting v0.2.0
+time unit displayed in timer (default: seconds) setting v0.3.0
fix current event: make back source of truth;
remove advanced logic from tick api;
fix current event: make back source of truth;
remove advanced logic from tick api;
db lock while schedule create?
===
xz:
add flag to store? - events loaded


===
reset/update tables:
npm run db-sync

on SERVER start
create config (+sch+evnts) if none

on CLIENT start
sse request goes with response 'Content-Type': 'text/event-stream'



