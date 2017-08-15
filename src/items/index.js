import { compileTemplate } from '../template';

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

    const mouseUp = (event) => {
        if (operation == null) return;

        const { $movingCard, $card } = operation;

        const $siEl = $('.' + settings.itemsOptions.highlightItemCss + ':visible'); // fixme

        if ($siEl.length !== 0 && $siEl.data('match') == 1) {
            const rowHeight = settings.lineHeight + 1;
            const index = parseInt($movingCard.data('index'));
            const column = parseInt($siEl.parent().data('column'));
            const isAssigned = !!$movingCard.data('assigned');
            const item = getItem(index, isAssigned);
            let offsetInMinutes = (60 / settings.rowsPerHour * ($movingCard[0].offsetTop / rowHeight)); // <<== FIXME 
            console.log(offsetInMinutes); // TODO: << need for task.start 
            //Math.floor(offsetInMinutes % 60)

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

            if (!isAssigned) {
                settings.tasks.push({
                    column,
                    start: "10:00", // TODO: fixit
                    item
                });
            } else {
                let task = settings.tasks.find(t => t.item.index === index);
                task.start = "10:00", // TODO: fixit
                task.column = column;
            }

            settings.itemsOptions.onItemDidAssigned && settings.itemsOptions.onItemDidAssigned({ item, interval, offsetInMinutes });
        } else {
            $movingCard.remove();
            $card.show();
        }

        $('.' + settings.itemsOptions.highlightItemCss).hide();

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

        $shifts.each(function () {
            const $this = $(this);
            const elementBounding = this.getBoundingClientRect();
            const $el = $this.find('.' + settings.itemsOptions.highlightItemCss);

            if (x > elementBounding.left && x < elementBounding.right &&
                y > elementBounding.top && y < elementBounding.bottom) {

                const offsetTop = y - elementBounding.top;
                const rowCount = (Math.floor(offsetTop / rowHeight) - 1);
                const top = Math.min(
                    Math.max(0, rowCount * rowHeight),
                    this.clientHeight - height
                );

                const offsetInMinutes = 60 / settings.rowsPerHour * (top / rowHeight); // <<== FIXME 
                const interval = settings.data[$this.data('column')].availableIntervals[$this.data('item-index')];
                const matchResult = settings.itemsOptions.matchFunc(item, interval, offsetInMinutes);

                $el.css({ top: top })
                    .css('background-color', matchResult.color)
                    .height(height)
                    .show();


                $el.data('match', +matchResult.match);
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