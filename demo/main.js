$(function () {
  var populate = (data, template) => {
    $("#skeduler-container").skeduler({
      rowsPerHour: 2,
      lineHeight: 20,
      getHeader: item => item.name,
      data: data.specialists,
      tasks: data.tasks,
      cardTemplate: template,
      onClick: (e, t) => { console.log(e, t); },
      itemsOptions: {
        enabled: true,
        containerSelector: "#skeduler-items",
        items: data.items
      }
    });
  };

  var templateLoaded = (template) => {
    $.getJSON('demo/data.json', (data) => {
      populate(data, template);
    });
  };

  $.get('demo/card-template.html', templateLoaded);
});