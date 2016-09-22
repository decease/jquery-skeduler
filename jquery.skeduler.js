(function ( $ ) {
  var defaultSettings = {
      // Data attributes
      headers: [],  // String[] - Array of column headers
      tasks: [],    // Task[] - Array of tasks. Required fields: 
                    // id: number, startTime: number, duration: number, column: number

      // Card template - Inner content of task card. 
      // You're able to use ${key} inside template, where key is any property from task.
      cardTemplate: '<div>${id}</div>',

      // OnClick event handler
      onClick: function (e, task) {},

      // Css classes
      containerCssClass: 'skeduler-container',
      headerContainerCssClass: 'skeduler-headers',
      schedulerContainerCssClass: 'skeduler-main',
      taskPlaceholderCssClass: 'skeduler-task-placeholder',
      cellCssClass: 'skeduler-cell',

      lineHeight: 30,      // height of one half-hour line in grid
      borderWidth: 1,      // width of board of grid cell

      debug: false
  };
  var settings = {};

  /**
   * Convert double value of hours to zero-preposited string with 30 or 00 value of minutes
   */
  function toTimeString(value) {
    return (value < 10 ? '0' : '') + Math.ceil(value) + (Math.ceil(value) > Math.floor(value) ? ':30' : ':00');
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

  /**
  * Render card template
  */
  function renderInnerCardContent(task) {
    var result = settings.cardTemplate;
    for (var key in task) {
      if (task.hasOwnProperty(key)) {
        // TODO: replace all
        result = result.replace('${' + key + '}', task[key]);
      }
    }

    return $(result);
  }

  /** 
   * Generate task cards
   */
  function appendTasks(placeholder, tasks) {
    tasks.forEach(function(task) {
      var innerContent = renderInnerCardContent(task);
      var top = getCardTopPosition(task.startTime);
      var height = getCardHeight(task.duration);

      var card = $('<div></div>')
        .attr({
          style: 'top: ' + top + 'px; height: ' + height + 'px',
          title: toTimeString(task.startTime) + ' - ' + toTimeString(task.startTime + task.duration)
        });
        card.on('click', function (e) { settings.onClick && settings.onClick(e, task) });
        card.append(innerContent)
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
    settings = $.extend(defaultSettings, options);

    if (settings.debug) {
      console.time('skeduler');
    }

    var skedulerEl = $(this);

    skedulerEl.empty();
    skedulerEl.addClass(settings.containerCssClass);

    var div = $('<div></div>');

    // Add headers
    var headerContainer = div.clone().addClass(settings.headerContainerCssClass);
    settings.headers.forEach(function(element) {
      div.clone().text(element).appendTo(headerContainer);
    }, this);
    skedulerEl.append(headerContainer);

    // Add schedule
    var scheduleEl = div.clone().addClass(settings.schedulerContainerCssClass);
    var scheduleTimelineEl = div.clone().addClass(settings.schedulerContainerCssClass + '-timeline');
    var scheduleBodyEl = div.clone().addClass(settings.schedulerContainerCssClass + '-body');

    var gridColumnElement = div.clone();

    for (var i = 0; i < 24; i++) {
      // Populate timeline
      div.clone()
        .text(toTimeString(i))
        .appendTo(scheduleTimelineEl);
      div.clone().appendTo(scheduleTimelineEl);

      gridColumnElement.append(div.clone().addClass(settings.cellCssClass));
      gridColumnElement.append(div.clone().addClass(settings.cellCssClass));
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

    skedulerEl.append(scheduleEl);

    if (settings.debug) {
      console.timeEnd('skeduler');
    }

    return skedulerEl;
  };
}( jQuery ));