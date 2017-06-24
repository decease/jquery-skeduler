(function ($) {
  var defaultSettings = {
    // Data attributes
    headers: [],  // String[] - Array of column headers
    tasks: [],    // Task[] - Array of tasks. Required fields: 
    // id: number, startTime: number, duration: number, column: number

    // Card template - Inner content of task card. 
    // You're able to use ${key} inside template, where key is any property from task.
    cardTemplate: '<div>${id}</div>',

    // OnClick event handler
    onClick: function (e, task) { },

    // Css classes
    containerCssClass: 'skeduler-container',
    headerContainerCssClass: 'skeduler-headers',
    schedulerContainerCssClass: 'skeduler-main',
    taskPlaceholderCssClass: 'skeduler-task-placeholder',
    cellCssClass: 'skeduler-cell',
    resizableHandlerCssClass: 'resizable-handler',
    resizableSliderCssClass: 'resizable-slider',

    lineHeight: 30,         // height of one half-hour line in grid
    borderWidth: 1,         // width of board of grid cell
    columnWidth: 200,
    minColumnWidth: 100,

    rowsPerHour: 2,         // count of rows for one hour

    columnResizeEnabled: true, // is columns resizable

    debug: true
  };

  var settings = {};
  var ownerDocument = null;
  var $headerContainer = null;
  var $skedulerEl = null;
  var $scheduleEl = null
  var operation = null;

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
    return (settings.lineHeight + settings.borderWidth) * (duration * settings.rowsPerHour) - 1;
  }

  /**
   * Return top offset of task card based on start time of the task
   * startTime - in hours
   */
  function getCardTopPosition(startTime) {
    return (settings.lineHeight + settings.borderWidth) * (startTime * settings.rowsPerHour);
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
    tasks.forEach(function (task) {
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

  function onPointerUp(event) {
    let op = operation;
    if (!operation) { return; }

    ownerDocument.off('mouseup');
    ownerDocument.off('mousemove');

    operation = null;
  }

  function onPointerMove(event) {
    let op = operation;
    if (!operation) { return; }

    // Determine the delta change between start and new mouse position, as a percentage of the table width
    let difference = (event.pageX - op.startX);// / $scheduleEl.width() * 100;
    if (difference === 0) {
      return;
    }

    let columnNumber = op.columnNumber;
    let width = op.width + difference;
    updateColumnWidth(columnNumber, width.toFixed(2));
  }

  function onPointerDown(event) {
    // Only applies to left-click dragging
    if (event.which !== 1) { return; }

    // If a previous operation is defined, we missed the last mouseup.
    // Probably gobbled up by user mousing out the window then releasing.
    // We'll simulate a pointerup here prior to it
    if (operation) {
      onPointerUp(event);
    }

    let $currentGrip = $(event.currentTarget);
    let columnNumber = $currentGrip.data('column-id');

    let gripIndex = $currentGrip.index();
    let $leftColumn = $headerContainer.find('div').eq(gripIndex);

    let leftWidth = $leftColumn[0].clientWidth;

    operation = {
      columnNumber,
      startX: event.pageX,
      width: leftWidth
    };

    ownerDocument.on('mousemove', onPointerMove);
    ownerDocument.on('mouseup', onPointerUp);

    event.preventDefault();
  }

  function updateColumnWidth(columnNumber, width) {
    width = Math.max(width, settings.minColumnWidth);
    $('.' + settings.headerContainerCssClass + ' > div:eq(' + columnNumber + ')')
      .css('flex-basis', width + 'px');

    let column = $('.' + settings.schedulerContainerCssClass + '-body > div:eq(' + columnNumber + ') > .' + settings.cellCssClass);
    var diff = column.width() - width;
    column.width(width);

    $('.' + settings.resizableHandlerCssClass + ' > div').each((index, el) => {
      if (index >= columnNumber) {
        let $el = $(el);
        let left = parseInt($el.css('left').replace('px', ''));
        $el.css('left', left - diff);
      }
    });
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
  $.fn.skeduler = function (options) {
    settings = $.extend(defaultSettings, options);

    if (settings.debug) {
      console.time('skeduler');
    }

    $skedulerEl = $(this);

    ownerDocument = $($skedulerEl[0].ownerDocument);

    $skedulerEl.empty();
    $skedulerEl.addClass(settings.containerCssClass);

    var div = $('<div></div>');

    // Add headers
    $headerContainer = div.clone().addClass(settings.headerContainerCssClass);
    settings.headers.forEach(function (element) {
      div.clone()
        .text(element)
        .appendTo($headerContainer);
    }, this);
    $skedulerEl.append($headerContainer);

    // Add schedule
    $scheduleEl = div.clone().addClass(settings.schedulerContainerCssClass);
    var scheduleTimelineEl = div.clone().addClass(settings.schedulerContainerCssClass + '-timeline');
    var scheduleBodyEl = div.clone().addClass(settings.schedulerContainerCssClass + '-body');

    var gridColumnElement = div.clone();

    for (var i = 0; i < 24; i++) {
      // Populate timeline
      for (var j = 0; j < settings.rowsPerHour; j++) {
        var timelineCell = div.clone()
          .height(settings.lineHeight)
          .addClass(j == settings.rowsPerHour - 1 ? "last" : "");

        if (j == 0) {
          timelineCell = timelineCell
            .css("line-height", settings.lineHeight + 'px')
            .text(j == 0 ? toTimeString(i) : "");
        }
        timelineCell.appendTo(scheduleTimelineEl);

        div.clone()
          .addClass(settings.cellCssClass)
          .height(settings.lineHeight)
          .addClass(j == settings.rowsPerHour - 1 ? "last" : "")
          .appendTo(gridColumnElement);
      }
    }

    // Populate grid
    for (var j = 0; j < settings.headers.length; j++) {
      var el = gridColumnElement.clone();

      var placeholder = div.clone().addClass(settings.taskPlaceholderCssClass);
      appendTasks(placeholder, settings.tasks.filter(function (t) { return t.column == j }));

      el.prepend(placeholder);
      el.appendTo(scheduleBodyEl);

      updateColumnWidth(j, settings.columnWidth);
    }

    $scheduleEl.append(scheduleTimelineEl);
    $scheduleEl.append(scheduleBodyEl);

    $skedulerEl.append($scheduleEl);

    // Set default width for columns
    for (var j = 0; j < settings.headers.length; j++) {
      updateColumnWidth(j, settings.columnWidth);
    }

    if (settings.columnResizeEnabled) {
      var skedulerElResizableHandler = div.clone()
        .addClass(settings.resizableHandlerCssClass);

      $skedulerEl.prepend(skedulerElResizableHandler);

      skedulerElResizableHandler.width($skedulerEl.width());

      var resizableSliderHeight = $scheduleEl.height() + $headerContainer.height();
      var index = 0;
      $headerContainer.find('div').each((_, el) => {
        div.clone()
          .addClass(settings.resizableSliderCssClass)
          .css('left', el.offsetLeft + el.clientWidth)
          .height(resizableSliderHeight)
          .data('column-id', index++)
          .appendTo(skedulerElResizableHandler)
      });

      skedulerElResizableHandler.on('mousedown', '.' + settings.resizableSliderCssClass, onPointerDown);
    }

    if (settings.debug) {
      console.timeEnd('skeduler');
    }

    return $skedulerEl;
  };
}(jQuery));