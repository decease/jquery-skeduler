import { compileTemplate } from '../template';
import { parseTime, toTime } from '../utils';

const div = (cssClass) => $('<div></div>').addClass(cssClass);

const getItemDivs = (settings) => {
    const $div = div(settings.itemsOptions.itemCardCssClass);
    const items = settings.items;
    const template = compileTemplate(settings.itemsOptions.itemCardTemplate, {
        time: (item) => item.interval ? `${item.interval.start} to ${item.interval.end}` : ''
    });

    return items.map((item) => $div.clone()
        .data('index', item.index)
        .html(template(item))
    );
}

const findStartTime = (rowIndex, rowsPerHour, interval) => {
    rowIndex = Math.max(0, rowIndex);
    const hoursFromTop = rowIndex / rowsPerHour;

    return toTime(hoursFromTop + parseTime(interval.start));
}

const populateSkedulerItems = (settings) => {
    const getItem = (index, isAssigned) => {
        return isAssigned
            ? settings.tasks.filter(t => t.item.index === index)[0].item
            : settings.items.filter(i => i.index === index)[0];
    }

    const $skedulerItemsEl = $(settings.itemsOptions.containerSelector)
        .empty()
        .addClass(settings.itemsOptions.itemsCssClass);
    const $ownerDocument = $($skedulerItemsEl[0].ownerDocument);
    const $shifts = $('.' + settings.availableIntervalPlaceholderCssClass + ' > div');

    const $headerDiv = div()
        .html('<h1 class="si-header">' + settings.itemsOptions.title + '</h1>')
        .appendTo($skedulerItemsEl);

    const $skedulerItemsContainerEl = div('si-container');
    var $items = getItemDivs(settings);
    $items.forEach(el => {
        $skedulerItemsContainerEl.append(el);
    });
    $skedulerItemsContainerEl.appendTo($skedulerItemsEl);

    let operation = null;
    let $conflictedCard = null;

    const mouseUp = (event) => {
        if (operation == null) return;

        const { $movingCard, $card, startTime } = operation;

        const $siEl = $('.' + settings.itemsOptions.highlightItemCss + ':visible'); // fixme

        const index = parseInt($movingCard.data('index'));
        const isAssigned = !!$movingCard.data('assigned');
        const item = getItem(index, isAssigned);

        if ($conflictedCard) {
            $conflictedCard.removeClass('conflicted');
            $conflictedCard = null;
        }

        if ($skedulerItemsContainerEl.data('selected') == 1) {
            if (isAssigned) {
                settings.tasks = settings.tasks.filter(t => t.item.index != index);
                settings.items.push(item);
            }

            $movingCard
                .detach()
                .css({ top: 'auto', left: 'auto' })
                .height('auto')
                .width('auto')
                .data('assigned', 0)
                .removeClass(`${settings.itemsOptions.itemCardCssClass}-moving`)
                .removeClass(`${settings.itemsOptions.itemCardCssClass}-pinned`)
                .appendTo($skedulerItemsContainerEl);

            $movingCard.on('mousedown', mouseDown);
            $card.remove();
        } else if ($siEl.length !== 0 && $siEl.data('match') == 1) {
            const rowHeight = settings.lineHeight + 1;
            const column = parseInt($siEl.parent().data('column'));
            let offsetInMinutes = parseTime(startTime) * 60;

            const interval = settings.data[column].availableIntervals[$siEl.parent().data('item-index')];

            settings.itemsOptions.onItemWillBeAssigned && settings.itemsOptions.onItemWillBeAssigned({ item, interval, offsetInMinutes });

            $movingCard
                .detach()
                .css({ top: $siEl[0].offsetTop, left: 0 })
                .height($siEl[0].clientHeight)
                .width('auto')
                .data('assigned', 1)
                .removeClass(`${settings.itemsOptions.itemCardCssClass}-moving`)
                .addClass(`${settings.itemsOptions.itemCardCssClass}-pinned`)
                .appendTo($siEl.parent());

            $movingCard.on('mousedown', mouseDown);
            $card.remove();

            if (!isAssigned) {
                settings.tasks.push({
                    column,
                    start: startTime,
                    item
                });
            } else {
                let task = settings.tasks.find(t => t.item.index === index);
                task.start = startTime,
                    task.column = column;
            }

            settings.itemsOptions.onItemDidAssigned && settings.itemsOptions.onItemDidAssigned({ item, interval, offsetInMinutes });
        } else {
            $movingCard.remove();
            $card.show();
        }

        $('.' + settings.itemsOptions.highlightItemCss).hide();
        $skedulerItemsContainerEl.removeClass('highlighted');
        $skedulerItemsContainerEl.data('selected', 0);

        operation = null;
        $ownerDocument.off('mousemove', mouseMove);
        $ownerDocument.off('mouseup', mouseUp);
    };

    const mouseMove = (event) => {
        if (operation == null) return;

        const { $movingCard, offsetX, offsetY } = operation;

        const newOffsetX = event.pageX - offsetX,
            newOffsetY = event.pageY - offsetY;

        $movingCard.css({
            top: newOffsetY + 'px',
            left: newOffsetX + 'px'
        });

        // Higlight shifts
        const _window = $ownerDocument[0].defaultView;
        const x = event.pageX;
        const y = event.pageY - _window.scrollY;

        const rowHeight = settings.lineHeight + 1;
        const rowsPerHour = settings.rowsPerHour;

        const index = parseInt($movingCard.data('index'));
        const isAssigned = !!$movingCard.data('assigned');
        const item = getItem(index, isAssigned);
        const duration = item.duration;
        const height = duration * (rowHeight * rowsPerHour / 60);

        if ($conflictedCard) {
            $conflictedCard.removeClass('conflicted');
            $conflictedCard = null;
        }

        $skedulerItemsContainerEl.each(function () {
            const $this = $(this);
            const elementBounding = this.getBoundingClientRect();

            if (x > elementBounding.left && x < elementBounding.right &&
                y > elementBounding.top && y < elementBounding.bottom) {
                $this.addClass('highlighted');
                $skedulerItemsContainerEl.data('selected', 1);
            } else {
                $this.removeClass('highlighted');
                $skedulerItemsContainerEl.data('selected', 0);
            }
        });
        $shifts.each(function () {
            const $this = $(this);
            const elementBounding = this.getBoundingClientRect();
            const $el = $this.find('.' + settings.itemsOptions.highlightItemCss);

            if (x > elementBounding.left && x < elementBounding.right &&
                y > elementBounding.top && y < elementBounding.bottom) {

                const offsetTop = y - elementBounding.top;
                const rowIndex = (Math.floor(offsetTop / rowHeight) - 1);
                const top = Math.min(
                    Math.max(0, rowIndex * rowHeight),
                    this.clientHeight - height
                );

                const column = +$this.data('column');
                const itemIndex = +$this.data('item-index');
                const offsetInMinutes = 60 / settings.rowsPerHour * (top / rowHeight); // <<== FIXME
                const interval = settings.data[column].availableIntervals[itemIndex];
                const matchResult = settings.itemsOptions.matchFunc(item, interval, offsetInMinutes);

                operation.startTime = findStartTime(rowIndex, rowsPerHour, interval);

                $el.css({ top: top })
                    .css('background-color', matchResult.color)
                    .height(height)
                    .show();


                $el.data('match', +matchResult.match);

                if (matchResult.match) {
                    settings.tasks.filter(t => t.column == column && t.item.index != index).forEach(t => {
                        const taskStart = parseTime(t.start);
                        const movingTaskStart = parseTime(operation.startTime);

                        if (!(taskStart >= movingTaskStart + item.duration / 60)
                            && !(taskStart + t.item.duration / 60 <= movingTaskStart)) {
                            // TODO t is a conflicted task
                            console.log(t.item.name);
                            $this.find('.si-card').each(function () {
                                if ($(this).data('index') == t.item.index) {
                                    $conflictedCard = $(this);
                                    $conflictedCard.addClass('conflicted');
                                }
                            })
                        }
                    });
                }
            } else {
                $el.data('match', 0);
                $el.hide();
            }
        });
    };

    const mouseDown = (event /*: MouseEvent */) => {
        if (event.which !== 1) { return; }

        const $skedulerWrapper = $(`.${settings.skedulerWrapperCssClass}`);
        const $card = $(event.currentTarget);

        const $movingCard =
            $card.clone()
                .data('index', $card.data('index'))
                .data('assigned', $card.data('assigned'))
                .addClass(`${settings.itemsOptions.itemCardCssClass}-moving`)
                .removeClass(`${settings.itemsOptions.itemCardCssClass}-pinned`)
                .width($card.width())
                .appendTo($skedulerWrapper);

        //var bounce = $card[0].getBoundingClientRect();
        // fixme ^^^
        const offsetX = event.pageX - event.offsetX,
            offsetY = event.pageY - event.offsetY;

        $movingCard.css({
            top: offsetY + 'px',
            left: offsetX + 'px'
        });

        operation = {
            $card,
            $movingCard,
            offsetX: event.offsetX,
            offsetY: event.offsetY
        };

        const index = parseInt($card.data('index'));
        const isAssigned = !!$movingCard.data('assigned');
        const item = getItem(index, isAssigned);

        $card.hide();

        $ownerDocument.on('mousemove', mouseMove);
        $ownerDocument.on('mouseup', mouseUp);

        event.preventDefault();
    };

    $('.' + settings.itemsOptions.itemCardCssClass).on('mousedown', mouseDown);
}

export default populateSkedulerItems;