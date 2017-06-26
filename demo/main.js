$(function () {
  var populate = (data, template) => {
    var headers = data.specialists.map(d => d.name);
    var items = data.items;
    var tasks = [];

    $("#skeduler-container").skeduler({
      rowsPerHour: 4,
      lineHeight: 40,
      headers: headers,
      tasks: tasks,
      cardTemplate: template,
      onClick: (e, t) => { console.log(e, t); }
    });

    $("#skeduler-items").skedulerItems({
      items: items
    });
  };

  var templateLoaded = (template) => {
    $.getJSON('data.json', (data) => {
      populate(data, template);
    });
  };

  $.get('card-template.html', templateLoaded);
});