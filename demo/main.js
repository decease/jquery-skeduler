function generate() {
  var timeline_start_hour = 8;
  var timeline_end_hour = 20;
  var tasks = [];
  for (var i = 0; i < 5; i++) {
    var startTime = -1;
    var duration = 0.5;
    for (var j = 0; j < 10; j++) {
      if (Math.random() * 10 > 5) {
        startTime += 0.5 + duration;
      } else {
        startTime += 1 + duration;
      }

      if (Math.random() * 10 > 5) {
        startTime -= duration;

        startTime = Math.max(0, startTime);
      }

      if (startTime > 23) {
        break;
      }

      duration = Math.ceil(Math.random() * 2) + (Math.random() * 10 > 5 ? 0 : 0.5);

      duration -= startTime + duration > 24 ? (startTime + duration) - 24 : 0;

      if(startTime>timeline_start_hour && (startTime+duration < timeline_end_hour)){
        var task = {
          startTime: startTime,
          duration: duration,
          column: i,
          id: Math.ceil(Math.random() * 100000),
          title: 'Service ' + j + ' by specialist ' + i
        };
  
        tasks.push(task);
      }
    }
  }

  console.log("tasks count: " + tasks.length);

  console.log(JSON.stringify(tasks));

  $("#skeduler-container").skeduler({
    headers: ["Specialist 1", "Specialist 2", "Specialist 3", "Specialist 4", "Specialist 5"],
    tasks: tasks,
    cardTemplate: '<div>${id}</div><div>${title}</div>',
    timelineStart: timeline_start_hour,
    timelineStop: timeline_end_hour,
    onClick: function (e, t) { console.log(e, t); }
  });
}