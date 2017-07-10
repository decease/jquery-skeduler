import { defaultSettings } from './settings';
import populateSkedulerItems from './items';
import { compileTemplate } from './template';

class Skeduler {
    constructor($container, options) {
        this.settings = $.extend(true, defaultSettings, options);
        this.$container = $container;
        this.$ownerDocument = $($container[0].ownerDocument);
        this.$headerContainer = null;
        this.$scheduleEl = null
        this.operation = null;

        if (this.settings.debug) {
            console.time('skeduler');
        }

        this.populate();
        if (this.settings.itemsOptions.enabled) {
            populateSkedulerItems(this.settings);
        }

        if (this.settings.debug) {
            console.timeEnd('skeduler');
        }
    }

    populate() {
        this.$container.empty();
        this.$container.addClass(this.settings.containerCssClass);

        const headers = this.settings.headers
            ? this.settings.headers
            : this.settings.data.map(this.settings.getHeader);

        const div = $('<div></div>');

        // Add headers
        this.$headerContainer = div.clone().addClass(this.settings.headerContainerCssClass);
        headers.forEach((element) => {
            div.clone()
                .text(element)
                .appendTo(this.$headerContainer);
        }, this);
        this.$container.append(this.$headerContainer);

        // Add scheduler
        this.$scheduleEl = div.clone().addClass(this.settings.schedulerContainerCssClass);
        const scheduleTimelineEl = div.clone().addClass(this.settings.schedulerContainerCssClass + '-timeline');
        const scheduleBodyEl = div.clone().addClass(this.settings.schedulerContainerCssClass + '-body');

        const gridColumnElement = div.clone();

        for (let i = 0; i < 24; i++) {
            // Populate timeline
            for (let j = 0; j < this.settings.rowsPerHour; j++) {
                let timelineCell = div.clone()
                    .height(this.settings.lineHeight)
                    .addClass(j == this.settings.rowsPerHour - 1 ? "last" : "");

                if (j == 0) {
                    timelineCell = timelineCell
                        .css("line-height", this.settings.lineHeight + 'px')
                        .text(j == 0 ? this.toTimeString(i) : "");
                }
                timelineCell.appendTo(scheduleTimelineEl);

                div.clone()
                    .addClass(this.settings.cellCssClass)
                    .height(this.settings.lineHeight)
                    .addClass(j == this.settings.rowsPerHour - 1 ? "last" : "")
                    .appendTo(gridColumnElement);
            }
        }

        // Populate grid
        for (let j = 0; j < headers.length; j++) {
            const el = gridColumnElement.clone();

            const tasksPlaceholder = div.clone().addClass(this.settings.taskPlaceholderCssClass);
            this.appendTasks(tasksPlaceholder, this.settings.tasks.filter(t => t.column == j));

            // fixme [workingTimeIntervals must not use index]
            const workingIntervalsPlaceholder = div.clone().addClass(this.settings.workingIntervalPlaceholderCssClass);
            const intervals = this.settings.data[j].workingTimeIntervals;
            this.appendAvailableInterval(workingIntervalsPlaceholder, intervals, j);

            el.prepend(tasksPlaceholder);
            el.prepend(workingIntervalsPlaceholder);
            el.appendTo(scheduleBodyEl);

            this.updateColumnWidth(j, this.settings.columnWidth);
        }

        this.$scheduleEl.append(scheduleTimelineEl);
        this.$scheduleEl.append(scheduleBodyEl);

        this.$container.append(this.$scheduleEl);

        // Set default width for columns
        for (let j = 0; j < headers.length; j++) {
            this.updateColumnWidth(j, this.settings.columnWidth);
        }

        // Configure resizing
        if (this.settings.columnResizeEnabled) {
            this.configureResizing();
        }
    }

    configureResizing() {
        const div = $('<div></div>');

        const skedulerElResizableHandler = div.clone()
            .addClass(this.settings.resizableHandlerCssClass);

        this.$container.prepend(skedulerElResizableHandler);

        skedulerElResizableHandler.width(this.$container.width());

        const resizableSliderHeight = this.$scheduleEl.height() + this.$headerContainer.height();
        let index = 0;
        this.$headerContainer.find('div').each((_, el) => {
            div.clone()
                .addClass(this.settings.resizableSliderCssClass)
                .css('left', el.offsetLeft + el.clientWidth)
                .height(resizableSliderHeight)
                .data('column-id', index++)
                .appendTo(skedulerElResizableHandler)
        });

        skedulerElResizableHandler.on('mousedown', '.' + this.settings.resizableSliderCssClass, this.onPointerDown.bind(this));
    }

    /**
       * Convert double value of hours to zero-preposited string with 30 or 00 value of minutes
       */
    toTimeString(value) {
        return (value < 10 ? '0' : '') + Math.ceil(value) + (Math.ceil(value) > Math.floor(value) ? ':30' : ':00');
    }

    /**
     * Return height of task card based on duration of the task
     * duration - in hours
     */
    getCardHeight(duration) {
        const durationInMinutes = duration * 60;
        const heightOfMinute = (this.settings.lineHeight + this.settings.borderWidth) * this.settings.rowsPerHour / 60;
        return Math.ceil(durationInMinutes * heightOfMinute);
    }

    /**
     * Return top offset of task card based on start time of the task
     * startTime - in hours
     */
    getCardTopPosition(startTime) {
        const startTimeInt = this.parseTime(startTime);
        return (this.settings.lineHeight + this.settings.borderWidth) * (startTimeInt * this.settings.rowsPerHour);
    }

    /**
     * Parse time string and present it in hours (ex. '13:30' => 13.5)
     * @param {*string} time - time in format like '13:50', '11:00', '14'
     */
    parseTime(time) {
        return /\d{2}\:\d{2}/.test(time)
            ? parseInt(time.split(':')[0]) + parseInt(time.split(':')[1]) / 60
            : parseInt(time);
    }

    /**
    * Render card template
    */
    renderInnerCardContent(task) {
        const template = this.settings.cardTemplate;
        const result = compileTemplate(template)(task);

        return $(result);
    }

    /** 
     * Generate task cards
     */
    appendTasks(placeholder, tasks) {
        tasks.forEach((task) => {
            var innerContent = this.renderInnerCardContent(task);
            var top = this.getCardTopPosition(task.startTime);
            var height = this.getCardHeight(task.duration);

            var card = $('<div></div>')
                .attr({
                    style: 'top: ' + top + 'px; height: ' + height + 'px',
                    title: this.toTimeString(task.startTime) + ' - ' + this.toTimeString(task.startTime + task.duration)
                });
            card.on('click', (e) => { this.settings.onClick && this.settings.onClick(e, task) });
            card.append(innerContent)
                .appendTo(placeholder);
        }, this);
    }

    appendAvailableInterval(placeholder, intervals, column) {
        const div = $('<div></div>');
        intervals.forEach((interval, index) => {
            const innerContent = div.clone().text(this.settings.notAllocatedLabel);
            const top = this.getCardTopPosition(interval.start) + 2;
            const duration = this.parseTime(interval.end) - this.parseTime(interval.start);
            const height = this.getCardHeight(duration) - 5;

            const skItemHightlightDiv = div.clone()
                .addClass('si-highlight-item')
                .hide();

            const card = div.clone()
                .attr({
                    style: 'top: ' + top + 'px; height: ' + height + 'px'
                });

            card
                .data('column', column)
                .data('item-index', index)
                .append(innerContent)
                .append(skItemHightlightDiv)
                .appendTo(placeholder);

        }, this);
    }

    onPointerUp(event) {
        let op = this.operation;
        if (!this.operation) { return; }

        this.$ownerDocument.off('mouseup');
        this.$ownerDocument.off('mousemove');

        this.operation = null;
    }

    onPointerMove(event) {
        let op = this.operation;
        if (!this.operation) { return; }

        // Determine the delta change between start and new mouse position, as a percentage of the table width
        let difference = (event.pageX - op.startX);// / this.$scheduleEl.width() * 100;
        if (difference === 0) {
            return;
        }

        let columnNumber = op.columnNumber;
        let width = op.width + difference;
        this.updateColumnWidth(columnNumber, width.toFixed(2));
    }

    onPointerDown(event) {
        // Only applies to left-click dragging
        if (event.which !== 1) { return; }

        // If a previous this.operation is defined, we missed the last mouseup.
        // Probably gobbled up by user mousing out the window then releasing.
        // We'll simulate a pointerup here prior to it
        if (this.operation) {
            this.onPointerUp(event);
        }

        let $currentGrip = $(event.currentTarget);
        let columnNumber = $currentGrip.data('column-id');

        let gripIndex = $currentGrip.index();
        let $leftColumn = this.$headerContainer.find('div').eq(gripIndex);

        let leftWidth = $leftColumn[0].clientWidth;

        this.operation = {
            columnNumber,
            startX: event.pageX,
            width: leftWidth
        };

        this.$ownerDocument.on('mousemove', this.onPointerMove.bind(this));
        this.$ownerDocument.on('mouseup', this.onPointerUp.bind(this));

        event.preventDefault();
    }

    updateColumnWidth(columnNumber, width) {
        width = Math.max(width, this.settings.minColumnWidth);
        $('.' + this.settings.headerContainerCssClass + ' > div:eq(' + columnNumber + ')')
            .css('flex-basis', width + 'px');

        let column = $('.' + this.settings.schedulerContainerCssClass + '-body > div:eq(' + columnNumber + ') > .' + this.settings.cellCssClass);
        var diff = column.width() - width;
        column.width(width);

        $('.' + this.settings.resizableHandlerCssClass + ' > div').each((index, el) => {
            if (index >= columnNumber) {
                let $el = $(el);
                let left = parseInt($el.css('left').replace('px', ''));
                $el.css('left', left - diff);
            }
        });
    }
}

export default Skeduler;
