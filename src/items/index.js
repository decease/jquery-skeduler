import { compileTemplate } from '../template';

const div = (cssClass) => $('<div></div>').addClass(cssClass);

const getItemDivs = (settings) => {
    const $div = div(settings.itemsOptions.itemCardCssClass);
    const items = settings.itemsOptions.items;
    const template = compileTemplate(settings.itemsOptions.itemCardTemplate, {
        time: (item) => item.interval ? `${item.interval.start} to ${item.interval.end}` : ''
    });

    return items.map((item, index) => $div.clone()
        .data('index', index)
        .html(template(item))
    );
}

const populateSkedulerItems = (settings) => {
    const $skedulerItemsEl = $(settings.itemsOptions.containerSelector)
        .empty()
        .addClass(settings.itemsOptions.itemsCssClass);
    const $ownerDocument = $($skedulerItemsEl[0].ownerDocument);
    const $shifts = $('.' + settings.workingIntervalPlaceholderCssClass + ' > div');

    // TODO: Generate item's divs
    const $headerDiv = div()
        .html('<h1 class="si-header">Items</h1>')
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
            $movingCard
                .detach()
                .css({ top: $siEl[0].offsetTop, left: 0 })
                .height($siEl[0].clientHeight)
                .width('auto')
                .removeClass(`${settings.itemsOptions.itemCardCssClass}-moving`)
                .addClass(`${settings.itemsOptions.itemCardCssClass}-pinned`)
                .appendTo($siEl.parent());

            $movingCard.on('mousedown', mouseDownOnCard);
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
        const item = settings.itemsOptions.items[index];
        const duration = item.duration;
        const height = duration * (rowHeight * rowsPerHour / 60);

        $shifts.each(function () {
            const $this = $(this);
            const elementBounding = this.getBoundingClientRect();
            const $el = $this.find('.' + settings.itemsOptions.highlightItemCss);

            if (x > elementBounding.left && x < elementBounding.right
                && y > elementBounding.top && y < elementBounding.bottom) {

                const offsetTop = y - elementBounding.top;
                const rowCount = (Math.floor(offsetTop / rowHeight) - 1);
                const startInMinutes = 60 / settings.rowsPerHour * rowCount; // <<== FIXME 

                const interval = settings.data[$this.data('column')].workingTimeIntervals[$this.data('item-index')];
                const matchResult = settings.itemsOptions.matchFunc(item, interval, offsetInMinutes);

                const top = Math.min(
                    Math.max(0, rowCount * rowHeight),
                    this.clientHeight - height
                );
                

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

    const mouseDownOnCard = (event /*: MouseEvent */) => {
        if (event.which !== 1) { return; }

        const $skedulerWrapper = $(`.${settings.skedulerWrapperCssClass}`);
        const $card = $(event.currentTarget);

        const $movingCard =
            $card.clone()
                .data('index', $card.data('index'))
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
            $card, $movingCard,
            offsetX: event.offsetX, offsetY: event.offsetY
        };

        $card.hide();

        $ownerDocument.on('mousemove', mouseMove);
        $ownerDocument.on('mouseup', mouseUp);

        event.preventDefault();
    };

    $skedulerItemsEl.find('.' + settings.itemsOptions.itemCardCssClass).on('mousedown', mouseDownOnCard);
}

export default populateSkedulerItems;