import { defaultSettings } from './settings';

class Skeduler {
    constructor($container, options) {
        this.settings = $.extend(defaultSettings, options);
        this.$container = $container;
        this.$ownerDocument = $($container[0].ownerDocument);
        this.$headerContainer = null;
        this.$scheduleEl = null
        this.operation = null;

        if (this.settings.debug) {
            console.time('skeduler');
        }

        this.populate($container, options);
        if (this.settings.itemsOptions.enabled) {
            this.populateSkedulerItems(this.settings.itemsOptions);
        }

        if (this.settings.debug) {
            console.timeEnd('skeduler');
        }
    }

    populate() {
        this.$container.empty();
        this.$container.addClass(this.settings.containerCssClass);

        var div = $('<div></div>');

        // Add headers
        this.$headerContainer = div.clone().addClass(this.settings.headerContainerCssClass);
        console.log('this.$headerContainer', this.$headerContainer);
        this.settings.headers.forEach((element) => {
            div.clone()
                .text(element)
                .appendTo(this.$headerContainer);
        }, this);
        this.$container.append(this.$headerContainer);

        // Add schedule
        this.$scheduleEl = div.clone().addClass(this.settings.schedulerContainerCssClass);
        var scheduleTimelineEl = div.clone().addClass(this.settings.schedulerContainerCssClass + '-timeline');
        var scheduleBodyEl = div.clone().addClass(this.settings.schedulerContainerCssClass + '-body');

        var gridColumnElement = div.clone();

        for (var i = 0; i < 24; i++) {
            // Populate timeline
            for (var j = 0; j < this.settings.rowsPerHour; j++) {
                var timelineCell = div.clone()
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
        for (var j = 0; j < this.settings.headers.length; j++) {
            var el = gridColumnElement.clone();

            var placeholder = div.clone().addClass(this.settings.taskPlaceholderCssClass);
            this.appendTasks(placeholder, this.settings.tasks.filter(t => t.column == j ));

            el.prepend(placeholder);
            el.appendTo(scheduleBodyEl);

            this.updateColumnWidth(j, this.settings.columnWidth);
        }

        this.$scheduleEl.append(scheduleTimelineEl);
        this.$scheduleEl.append(scheduleBodyEl);

        this.$container.append(this.$scheduleEl);

        // Set default width for columns
        for (var j = 0; j < this.settings.headers.length; j++) {
            this.updateColumnWidth(j, this.settings.columnWidth);
        }

        if (this.settings.columnResizeEnabled) {
            var skedulerElResizableHandler = div.clone()
                .addClass(this.settings.resizableHandlerCssClass);

            this.$container.prepend(skedulerElResizableHandler);

            skedulerElResizableHandler.width(this.$container.width());

            var resizableSliderHeight = this.$scheduleEl.height() + this.$headerContainer.height();
            var index = 0;
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
    }

    populateSkedulerItems(options) {
        const $skedulerItemsEl = $(options.containerSelector);

        // $skedulerItemsEl.html(`
        //   <div></div>
        // `);
        let operation = null;

        const mouseUp = (event) => {
            if (operation == null) return;

            const { $movingCard } = operation;

            $movingCard.remove();

            operation = null;
            this.$ownerDocument.off('mousemove', mouseMove);
            this.$ownerDocument.off('mouseup', mouseUp);
        };

        const mouseMove = (event) => {
            if (operation == null) return;

            const { $movingCard } = operation;

            $movingCard.css({
                top: (event.clientY - $movingCard.height() / 2) + 'px',
                left: (event.clientX - $movingCard.width() / 2) + 'px'
            });
        };

        const mouseDownOnCard = (event /*: MouseEvent */) => {
            if (event.which !== 1) { return; }

            const $card = $(event.currentTarget);
            const duration = parseInt($card.data('duration'));
            const height = Math.ceil(this.settings.lineHeight * this.settings.rowsPerHour / 60 * duration);

            const $movingCard = $card.clone()
                .addClass('si-card-moving')
                .appendTo($skedulerItemsEl.parent());

            $movingCard
                .height(height + 'px')
                .css({
                    top: (event.clientY - $movingCard.height() / 2) + 'px',
                    left: (event.clientX - $movingCard.width() / 2) + 'px'
                })

            operation = {
                $card, $movingCard
            };

            this.$ownerDocument.on('mousemove', mouseMove);
            this.$ownerDocument.on('mouseup', mouseUp);

            event.preventDefault();
        };

        $skedulerItemsEl.find('.si-card').on('mousedown', mouseDownOnCard);
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
        return (this.settings.lineHeight + this.settings.borderWidth) * (duration * this.settings.rowsPerHour) - 1;
    }

    /**
     * Return top offset of task card based on start time of the task
     * startTime - in hours
     */
    getCardTopPosition(startTime) {
        return (this.settings.lineHeight + this.settings.borderWidth) * (startTime * this.settings.rowsPerHour);
    }

    /**
    * Render card template
    */
    renderInnerCardContent(task) {
        var result = this.settings.cardTemplate;
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

        console.log(this.$headerContainer);

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