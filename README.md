# doro v.2
what:
pomodoro timer
how works:
- has db of timer events
- on start subscribes to pool from tik@web
- to stop - update pool config
- pool ID = userHandler


-
schedule содержит только events
events создаются только в момент запуска (копируется из eventSchema)
event обязательно имеет eventSchema через проперти eventSchemaId
несколько events могут иметь одну eventSchema
schedule при создании копируется из scheduleSchema
scheduleSchema может содержать eventSchema и механизм последовательности.
eventSchema создается в момент настройки таймера или импорта события из вне.
одна eventSchema может принадлежать нескольким scheduleSchema
через таблицу связей eventSchemaToScheduleSchema.
userToEventSchema: {
	id: increment,
	eventSchemaId: number,
	userHandler: string
}
eventSchema: {
	id: number,
	order: number,
	name: string,
	type: number(id of eventType table),
	length: number,
	userHandler: string,
	created_at: DATETIME NOT NULL,
	updated_at: DATETIME NOT NULL,
}
scheduleSchema: {
	id: number,
	name?: string,
	created_at: DATETIME NOT NULL,
	updated_at: DATETIME NOT NULL,
	userHandler: string,
}
eventSchemaToScheduleSchema: {
	id: increment,
	eventSchemeId: number,
	scheduleEventId: number,
	order: number,
 ???	userHandler: string,
	access_level: enum('owner', 'editor', 'viewer')
	created_at: DATETIME NOT NULL,
	updated_at: DATETIME NOT NULL,
}
schedule: {
	id: increment,
	name: string,
	created_at: DATETIME NOT NULL,
	updated_at: DATETIME NOT NULL,
	userHandler: string,
	scheduleSchemaId: number,
}
event: {
	id
	name
	length
	type
	created_at: DATETIME NOT NULL,
}
add to event:
- updated_at
- eventSchemaId
- order?


-
когда cur становится равен len - событие заканчивается,
tik делает запрос в doro@back чтобы валидировать это состояние и получить следующее событие.

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
scheduleSchema - запись, содержащая слепок будущего расписания.
scheduleSchema создается в момент настройки будущего расписания.
должны быть scheduleSchema's по умолчанию - когда не хочется настраивать.
например - бесконечный классический pomodoro w/r/w/r/w/r/w/bigR.
В этом случае цикличность событий должна быть записана функцией.

по умолчанию события создаются по одному, только то, которое начинает быть активным.
--

при входе пользователя - он получает schedule.
schedule - это отыгранная последовательность событий или в последовательность событий процессе отыгрывания scheduleSchema.
schedule используется для истории.
Нужно ограничить schedule какими-то рамками.
зачем?
проще будет трекать историю: schedue = день.
проще осуществлять загрузку текущего состояния: просто загружаем schedule, не задумываемся, какие события нужны.
Что будет если не ограничить schedule?
При загрузке текущего schedule может быть загружено огромное количество событий.
Как это?
- был создан scheduleSchema по умолчанию, где цикличность событий записана функцией.
и проигрывался 10 дней. т е. 
час 1: 25 + 5 + 25 + 5,
час 2: 25 + 5 + 25 + 5,
час 3: 25(большой отдых) + 25 + 5 + 5(работа)
час 4: 20(работа) + 5 + 25 + 5 + 5(работа)
час 5: 20(работа) + 30(ольшой отдых) + 10(работа)
т е в среднем 4 события в час * 24 = 80 + 16 = 96. 96 * 10 = 960.

если schedule не ограничить временем - будут ситуации, когда в tik@ будет выгружаться слишком много ненужных событий, которые придется хэшировать итд, т. к. они не влезут в SSE payload.

Как обрезать schedule?
в какой-то момент должен создаваться следующий schedule.
самое понятное - это день по UTC.
у каждого schedule будет дата.
с одной датой может быть несколько shcedules.
для удобства загрузки - по умолчанию можно загружать все schedules за текущий и прошлый день.
почему так?
чтобы не заморачиваться со сдвигом часовых поясов серверов, которые сейчас обслуживают doro@back.
Как происходит создание нового schedule?

был scheduleSchema:
1. event 1, 30 min, start 23:00, end 00:15;
2. event 2, 1 h, start 00:15, end: 01:00;

где
текущее событие залезает на следующий день (сейчас 23:55)
что будет происходить?
пока событие длится - ничего не происходит.
как только оно заканчивается - в doro@ необходимо создать новый schedule.
если событие очень длинное и закончится через неделю - ничего страшного.
нам нужно только ограничить количество событий.

когда создан новый schedule (с датой следующего дня),
берется следующее событие из scheduleSchema, создается и присваивается новому schedule.

что если мы перескакиваем через событие (в интерфейсе списка) и это событие должно было выпасть на следующий день.
т е
(schedule 1)
1. event 1, 1.01 (прошло 100%)
2. event 2, 1.01
3. event 3, 2.01

запускаем event 3.
система не знает о том, что при последоватльном запуске это событие должно попасть в следующий schedule.
затем переключаемся на event 2.
и, так как сейчас уже время слежующего дня (2.01) оно должно попасть в новый schedule.

чет какая-то хрень.

чтобы не отдавать в tik@ лишние (законченные) события - нужен механизм очистки от них 
после того, как данным событиям будет присвоен флаг finished в doro@back.
Таким образом doro@web будет сразу отображать их как законченные, не ожидая от tik@ текущего статуса по ним.

Как тогда осуществлять загрузку текущего состояния при хводе пользователя?
теперь у schedule может быть сколько угодно событий. законченные будут с флагом.
т е выгружать в tik@ лишние события не понадобится.
при входе будет загружаться последний активный schedule?






Будет ли schedule обрезаться по рамкам суток? (0:00 - 23:59)


по умолчанию последний



получение состояния.
лист-компонент:
на старте идет запрос в свою дб event-state/list-by-user
который забирает конфиги событий пользователя.
Если есть события, таймер которых тикает,
0=inactive, 1=active, 2=paused -> т е "1"
то подписываемся на эти события.
В doro@ у пользователя в один момент активно одно событие.
плюс шаредные события. v2.1 при появлении более обного активного события у одного пользователя - нужно их смержить в единую подписку.
-
todo:
по изменению стейта события - сделать обновление пула в тик.
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



