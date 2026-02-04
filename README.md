# doro v.2
what:
pomodoro timer
how works:
- has db of timer events
- on start subscribes to pool from tik@web
- to stop - update pool config
- pool ID = userHandler

---
как будут выглядеть шаредные ивенты?
они не могут быть включены в расписание, потому что 
- ивент принадлежит одному расписанию
- он может быть в рамках него изменен.
Шаредные ивенты будут тикать рядом также как и основные, но не будут включены в основной флоу.

Нужен ли механизм, оповещающий о том, что шаредное событие изменено?
нет. но нужно исключать это событие из tik@
по какому-то признаку (например - по актуальности дня)

schedules
может принадлежать одному юзеру. шарить нельзя.
служит для организации ивентов в последовательность
и для загрузки определенного актуального расписания

когда cur становится равен len - событие заканчивается,
tik делает запрос в doro@back чтобы валидировать это состояние и получить следующее событие.
doro@back - единое место правды, если делать запросы с фронтов, их будет несколько, гонка, неконсистентность итд


todo:
entryAdapter
check api key? - for /receive-event-state

-


Если следующего события нет:
0) doro@ инициализирует соответствующий сценарий и вернет обновленный хэш в tik@. 
1) tik@ продолжает вещать законченное событие.
2) tik@ рассылает обновленный хэш конфига doro@, чтобы клиенты обновились.

Если произошел рассинхрон и событие не закончено в емп-doro@back 
(к примеру - была изменена его длительность):
0) doro@ возвращает обновленный хэш конфига и обновленное состояние данного (всех?) события.
1) tik@ обновляет событие и транслирует его вместе с обновленным хэшем конфига doro@.

Если в результате валидации doro@back событие действительно закончилось и есть следующее событие, например "работа > отдых":
а. если следующее событие уже было создано.
а.1 doro@ вернет собранный хэш конфига (он должен сопасть с тем, что был, потому что состав событий не изменился).
а.2 doro@ вернет новое соыбтие, tik@ добавит его и будет вещать вместе с законченным.

б. если следующее событие еще не было создано и хранится только в scheduleSchema
б.1 doro@back создаст новое событие
б.2 doro@back обновит хэш конфига
б.3 doro@back вернет новое событие и хэш
б.4 tik@ будет вещать новый хэш, новое событие вместе с предыдущим(законченным)

Если события не существует - удаляем его из tik@, обновляем конфиг doro@

Если к событию нет доступа - удаляем его из tik@, обновляем конфиг doro@

--
умолчанию можно загружать все schedules за текущий и прошлый день.
чтобы не заморачиваться со сдвигом часовых поясов серверов, которые сейчас обслуживают doro@back.

чтобы не отдавать в tik@ лишние (законченные) события - нужен механизм очистки от них 
после того, как данным событиям будет присвоен флаг finished в doro@back.
Таким образом doro@web будет сразу отображать их как законченные, не ожидая от tik@ текущего статуса по ним.

Как тогда осуществлять загрузку текущего состояния при хводе пользователя?
теперь у schedule может быть сколько угодно событий. законченные будут с флагом.
т е выгружать в tik@ лишние события не понадобится.

при входе будет загружаться последний активный schedule?
по умолчанию последний
Будет ли schedule обрезаться по рамкам суток? (0:00 - 23:59)




получение состояния.
лист-компонент:
на старте идет запрос в свою дб event-state/list-by-user
который забирает конфиги событий пользователя.
параллельно tik@ при инициализации стучится в doro@back 
и забирает нужные события с их статусом.

todo: продумать - что есть нужные события и кто это решает?
-

по изменению стейта события - происходит обновление пула в тик.
-
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



