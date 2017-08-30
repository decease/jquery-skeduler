import { defaultSettings } from './settings';
import populateSkedulerItems from './items';
import { compileTemplate } from './template';
import { parseTime } from './utils';

const div = (cssClass) => $('<div></div>').addClass(cssClass);

class Skeduler {
    constructor($container, options) {
        this.settings = $.extend(true, defaultSettings, options);
        this.$container = $container;
        this.$ownerDocument = $($container[0].ownerDocument);
        this.$headerContainer = null;
        this.$scheduleEl = null
        this.operation = null;
        this.resizeAllColumns = true;

        if (this.settings.debug) {
            console.time('skeduler');
        }

        this.refresh();

        if (this.settings.debug) {
            console.timeEnd('skeduler');
        }
    }

    setRowsPerHour(rowsPerHour) {
        this.settings.rowsPerHour = rowsPerHour;
        this.refresh();
    }

    setResizeAllColumns(resizeAllColumns) {
        this.resizeAllColumns = resizeAllColumns;
    }

    refresh() {
        this.settings.items = this.settings.items && this.settings.items.map(
            (item, index) => Object.assign({}, { index }, item)
        ) || [];
        this.settings.tasks = this.settings.tasks && this.settings.tasks.map(
            (task, index) => {
                task.item = Object.assign({}, { index: index + this.settings.items.length }, task.item);
                return task;
            }
        ) || [];

        this.populate();
        if (this.settings.itemsOptions.enabled) {
            populateSkedulerItems(this.settings);
        }
    }

    populate() {
        this.$container.empty();
        this.$container.addClass(this.settings.containerCssClass);

        const headers = this.settings.headers ?
            this.settings.headers :
            this.settings.data.map(this.settings.getHeader);

        // Add headers
        this.$headerContainer = div(this.settings.headerContainerCssClass);
        headers.forEach((element) => {
            div().text(element)
                .appendTo(this.$headerContainer);
        }, this);
        this.$container.append(this.$headerContainer);

        // Add scheduler
        this.$scheduleEl = div(this.settings.schedulerContainerCssClass);
        const scheduleTimelineEl = div(this.settings.schedulerContainerCssClass + '-timeline');
        const scheduleBodyEl = div(this.settings.schedulerContainerCssClass + '-body');

        const gridColumnElement = div();

        for (let i = 0; i < 24; i++) {
            // Populate timeline
            for (let j = 0; j < this.settings.rowsPerHour; j++) {
                let timelineCell = div()
                    .height(this.settings.lineHeight)
                    .addClass(j == this.settings.rowsPerHour - 1 ? "last" : "");

                if (j == 0) {
                    timelineCell = timelineCell
                        .css("line-height", this.settings.lineHeight + 'px')
                        .text(j == 0 ? this.toTimeString(i) : "");
                }
                timelineCell.appendTo(scheduleTimelineEl);

                div(this.settings.cellCssClass)
                    .height(this.settings.lineHeight)
                    .addClass(j == this.settings.rowsPerHour - 1 ? "last" : "")
                    .appendTo(gridColumnElement);
            }
        }

        // Populate grid
        for (let j = 0; j < headers.length; j++) {
            const el = gridColumnElement.clone();

            // fixme [availableIntervals must not use index]
            const availableIntervalsPlaceholder = div(this.settings.availableIntervalPlaceholderCssClass);
            const intervals = this.settings.data[j].availableIntervals;
            this.appendAvailableInterval(availableIntervalsPlaceholder, intervals, j);

            el.prepend(availableIntervalsPlaceholder);
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

    tasks() {
        return this.settings.tasks;
    }

    configureResizing() {
        const skedulerElResizableHandler = div(this.settings.resizableHandlerCssClass);

        this.$container.prepend(skedulerElResizableHandler);

        skedulerElResizableHandler.width(this.$container.width());

        const resizableSliderHeight = this.$scheduleEl.height() + this.$headerContainer.height();
        let index = 0;
        this.$headerContainer.find('div').each((_, el) => {
            div(this.settings.resizableSliderCssClass)
                .css('left', el.offsetLeft + el.clientWidth)
                .height(resizableSliderHeight)
                .data('column-id', index++)
                .appendTo(skedulerElResizableHandler)
        });

        skedulerElResizableHandler.on('mousedown', '.' + this.settings.resizableSliderCssClass, this.onResizePointerDown.bind(this));
    }

    appendAvailableInterval(placeholder, intervals, column) {
        const template = compileTemplate(this.settings.itemsOptions.shiftTemplate);
        intervals.forEach((interval, index) => {
            const innerContent = div(this.settings.itemsOptions.shiftDivCssClass)
                .html(template({ interval, column }));
            const top = this.getCardTopPosition(interval.start) + 2;
            const duration = parseTime(interval.end) - parseTime(interval.start);
            const height = this.getCardHeight(duration) - 5;

            const skItemHightlightDiv = div(this.settings.itemsOptions.highlightItemCss).hide();

            const shiftDiv = div()
                .attr({
                    style: 'top: ' + top + 'px; height: ' + height + 'px'
                });

            shiftDiv
                .data('column', column)
                .data('item-index', index)
                .append(innerContent)
                .append(skItemHightlightDiv)
                .appendTo(placeholder);

            this.appendTasks(
                shiftDiv,
                interval.start,
                this.settings.tasks.filter(t => t.column == column));
            // TODO: ^^^ filter by shift interval too

        }, this);
    }

    /** 
     * Generate task cards
     */
    appendTasks(placeholder, intervalStart, tasks) {
        tasks.forEach((task) => {
            let top = this.getCardTopPosition(task.start, intervalStart);
            let height = this.getCardHeight(task.item.duration / 60);

            task.$el = this.getItemDiv(task.item)
                .attr({
                    style: 'top: ' + top + 'px; height: ' + height + 'px'
                })
                .addClass(`${this.settings.itemsOptions.itemCardCssClass}`)
                .addClass(`${this.settings.itemsOptions.itemCardCssClass}-pinned`)
                .width('auto')
                .data('index', task.item.index)
                .data('assigned', 1)
                .appendTo(placeholder);
        }, this);
    }

    onResizePointerUp(event) {
        let op = this.operation;
        if (!this.operation) { return; }

        this.$ownerDocument.off('mouseup');
        this.$ownerDocument.off('mousemove');

        this.operation = null;
    }

    onResizePointerMove(event) {
        let op = this.operation;
        if (!this.operation) { return; }

        // Determine the delta change between start and new mouse position, as a percentage of the table width
        let difference = (event.pageX - op.startX); // / this.$scheduleEl.width() * 100;
        if (difference === 0) {
            return;
        }

        let columnNumber = op.columnNumber;
        let width = op.width + difference;
        if (this.resizeAllColumns) {
            for (let i = 0; i < this.settings.data.length; i++) {
                this.updateColumnWidth(i, width.toFixed(2));
            }
        } else {
            this.updateColumnWidth(columnNumber, width.toFixed(2));
        }
    }

    onResizePointerDown(event) {
        // Only applies to left-click dragging
        if (event.which !== 1) { return; }

        // If a previous this.operation is defined, we missed the last mouseup.
        // Probably gobbled up by user mousing out the window then releasing.
        // We'll simulate a pointerup here prior to it
        if (this.operation) {
            this.Resize(event);
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

        this.$ownerDocument.on('mousemove', this.onResizePointerMove.bind(this));
        this.$ownerDocument.on('mouseup', this.Resize.bind(this));

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

    getItemDiv(item) {
        const $div = div(this.settings.itemsOptions.itemCardCssClass);
        const template = compileTemplate(this.settings.itemsOptions.itemCardTemplate, {
            time: (item) => item.interval ? `${item.interval.start} to ${item.interval.end}` : ''
        });

        return div().html(template(item));
    }

    /**
    * Convert double value of hours to zero-preposited string with 30 or 00 value of minutes
    */
    toTimeString(value) {
        return (value < 10 ? '0' : '') + Math.floor(value) + (Math.ceil(value) > Math.floor(value) ? ':30' : ':00');
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
    getCardTopPosition(startTime, offsetTime) {
        let startTimeInt = parseTime(startTime);
        if (offsetTime) {
            startTimeInt -= parseTime(offsetTime);
        }
        return (this.settings.lineHeight + this.settings.borderWidth) * (startTimeInt * this.settings.rowsPerHour);
    }
}

export default Skeduler;