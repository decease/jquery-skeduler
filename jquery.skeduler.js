(function ( $ ) {
  var defaultSettings = {
      headers: [],
      tasks: [],

      containerCssClass: 'container',
      headerContainerCssClass: 'specialists-list',
      schedulerContainerCssClass: 'schedule',
      taskPlaceholderCssClass: 'task_placeholder',

      lineHeight: 30,      // height of one half-hour line in grid
      borderWidth: 1      // width of board of grid cell
  };
  var settings = {};

  var cardTemplate = '<div>${id}</div><div>${title}</div>';

  function toTimeString(value) {
    return (value < 10 ? '0' : '') + Math.round(value) + (value % 10 > 0 ? ':30' : ':00');
  }

  /**
   * Return height of task card based on duration of the task
   * duration - in hours
   */
  function getCardHeight(duration) {
    return (settings.lineHeight + settings.borderWidth) * (duration * 2) - 1;
  }

  /**
   * Return top offset of task card based on start time of the task
   * startTime - in hours
   */
  function getCardTopPosition(startTime) {
    return (settings.lineHeight + settings.borderWidth) * (startTime * 2);
  }

  function generateInnerCardContent(task) {
    var result = cardTemplate;
    for (var key in task) {
      if (task.hasOwnProperty(key)
            && key != 'startTime'
            && key != 'duration') {
              result = result.replace('${' + key + '}', task[key]);
      }
    }

    return $(result);
  }

  function appendTasks(placeholder, tasks) {
    tasks.forEach(function(task) {
      var innerContent = generateInnerCardContent(task);
      var top = getCardTopPosition(task.startTime);
      var height = getCardHeight(task.duration);

      $('<div></div>')
        .attr({
          style: 'top: ' + top + 'px; height: ' + height + 'px',
          title: toTimeString(task.startTime) + ' - ' + toTimeString(task.startTime + task.duration)
        })
        .append(innerContent)
        .appendTo(placeholder);
    }, this);
  }

  /**
  * Generate scheduler grid with task cards
  * options:
  * - headers: string[] - array of headers
  * - tasks: Task[] - array of tasks
  * - containerCssClass: string - css class of main container
  * - headerContainerCssClass: string - css class of header container
  * - schedulerContainerCssClass: string - css class of scheduler
  * - lineHeight - height of one half-hour cell in grid
  * - borderWidth - width of border of cell in grid
  */
  $.fn.skeduler = function( options ) {
    console.time('skeduler');

    settings = $.extend(defaultSettings, options);

    this.empty();
    this.addClass(settings.containerCssClass);

    var div = $('<div></div>');

    // Add headers
    var headerContainer = div.clone().addClass(settings.headerContainerCssClass);
    settings.headers.forEach(function(element) {
      div.clone().text(element).appendTo(headerContainer);
    }, this);
    this.append(headerContainer);

    // Add schedule
    var scheduleEl = div.clone().addClass(settings.schedulerContainerCssClass);
    var scheduleTimelineEl = div.clone().addClass(settings.schedulerContainerCssClass + '_timeline');
    var scheduleBodyEl = div.clone().addClass(settings.schedulerContainerCssClass + '_body');

    var gridColumnElement = div.clone();

    for (var i = 0; i < 24; i++) {
      // Populate timeline
      div.clone()
        .text(toTimeString(i))
        .appendTo(scheduleTimelineEl);
      div.clone().appendTo(scheduleTimelineEl);

      gridColumnElement.append(div.clone().addClass('cell'));
      gridColumnElement.append(div.clone().addClass('cell'));
    }

    // Populate grid
    for (var j = 0; j < settings.headers.length; j++) {
      var el = gridColumnElement.clone();
      
      var placeholder = div.clone().addClass(settings.taskPlaceholderCssClass);
      appendTasks(placeholder, settings.tasks.filter(function (t) { return t.column == j }));

      el.prepend(placeholder);
      el.appendTo(scheduleBodyEl);
    }

    scheduleEl.append(scheduleTimelineEl);
    scheduleEl.append(scheduleBodyEl);

    this.append(scheduleEl);

    console.timeEnd('skeduler');

    return this;
  };
}( jQuery ));