$(function () {
  var matchFunc = function(item, areaToMatch) {
    console.log({item, areaToMatch});

    return {match: true, color: 'blue'};
  }

  var populate = function (data, itemCardTemplate, cardTemplate) {
    $("#skeduler-container").skeduler({
      rowsPerHour: 2,
      lineHeight: 20,
      getHeader: item => item.name,
      data: data.specialists,
      tasks: data.tasks,
      cardTemplate: cardTemplate,
      onClick: function (e, t) { console.log(e, t); },
      itemsOptions: {
        enabled: true,
        containerSelector: "#skeduler-items",
        itemCardTemplate: itemCardTemplate,
        items: data.items,
        matchFunc: matchFunc
      }
    });
  };

  var cardTemplateLoaded = function (itemCardTemplate, cardTemplate) {
    $.getJSON('demo/data.json', function (data) {
      populate(data, itemCardTemplate, cardTemplate);
    });
  };

  var itemCardTemplateLoaded = function (itemCardTemplate) {
    $.get('demo/card-template.html', function (cardTemplate) {
      cardTemplateLoaded(itemCardTemplate, cardTemplate);
    });
  };

  $.get('demo/item-card-template.html', itemCardTemplateLoaded);
});