function generate() {
  var tasks = [];
  for (var i = 0; i < 20; i++) {
    var startTime = -1;
    var duration = 0.5;
    for (var j = 0; j < 20; j++) {
      if (Math.random() * 10 > 5) {
        startTime += 0.5 + duration;
      } else {
        startTime += 1 + duration;
      }

      if (startTime > 23) {
        console.log(startTime);
        console.log(duration);
        break;
      }

      duration = Math.ceil(Math.random() * 2) + (Math.random() * 10 > 5 ? 0 : 0.5);

      duration -= startTime + duration > 24 ? (startTime + duration) - 24 : 0;

      var task = {
        startTime: startTime,
        duration: duration,
        column: i,
        id: Math.ceil(Math.random() * 100000),
        title: 'Стрижка волос ' + i + ' ' + j
      };

      tasks.push(task);
    }
  }

  console.log("tasks count: " + tasks.length);

  $("#skeduler-container").skeduler({
    headers: ["Смирнов", "Иванов", "Сидоров", "Игнатов", "Нестеров",  "Орлов", "Табозин", "Гришин", "Арбузов", "Игорев",
              "Смирнов 2", "Иванов 2", "Сидоров 2", "Игнатов 2", "Нестеров 2",  "Орлов 2", "Табозин 2", "Гришин 2", "Арбузов 2", "Игорев 2"],
    tasks: tasks,
    cardTemplate: '<div>${id}</div><div>${title}</div><div>${title}</div><div>${title}</div><div>${title}</div><div>${title}</div>'
  });
}