$(function () {
  var toMinutes = function (interval) {
    return parseInt(interval.split(':')[0]) * 60 + parseInt(interval.split(':')[1]);
  }

  var matchFunc = function(item, interval, offsetInMinutes) {
    var success = {match: true, color: 'blue'};
    var unsuccess = {match: false, color: 'red'};

    var intervalStartInMinusets = toMinutes(interval.start);
    var intervalEndInMinusets = toMinutes(interval.end);

    var start = intervalStartInMinusets + offsetInMinutes;
    var end = start + item.duration;

    if (item.interval) {
      var itemStartInMinusets = toMinutes(item.interval.start);
      var itemEndInMinusets = toMinutes(item.interval.end);

      console.log('interval', start, end);
      return itemStartInMinusets == start && itemEndInMinusets == end
        ? success
        : unsuccess;
    } else {
      console.log('duration', item.duration, intervalEndInMinusets, intervalStartInMinusets, intervalEndInMinusets - intervalStartInMinusets);

      return item.duration <= intervalEndInMinusets - intervalStartInMinusets
        ? success
        : unsuccess;
    }

    return unsuccess;
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