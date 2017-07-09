import { compileTemplate } from '../template';

const div = (cssClass) => $('<div></div>').addClass(cssClass);

const getItemDivs = (settings) => {
    const $div = div(settings.itemsOptions.itemCardCssClass);
    const items = settings.itemsOptions.items;
    const template = compileTemplate(settings.itemsOptions.itemCardTemplate, {
        time: (item) => item.iterval ? `${item.iterval.start} to ${item.iterval.end}` : ''
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

        const siEl = $('.' + settings.itemsOptions.highlightItemCss + ':visible'); // fixme

        if (siEl.length !== 0) {
            $movingCard
                .detach()
                .css({ top: siEl[0].offsetTop, left: 0 })
                .height(siEl[0].clientHeight)
                .width('auto')
                .removeClass(`${settings.itemsOptions.itemCardCssClass}-moving`)
                .addClass(`${settings.itemsOptions.itemCardCssClass}-pinned`)
                .appendTo(siEl.parent());

            $movingCard.on('mousedown', mouseDownOnCard);

            $('.' + settings.itemsOptions.highlightItemCss).hide();
        } else {
            $movingCard.remove();
            $card.show();
        }

        operation = null;
        $ownerDocument.off('mousemove', mouseMove);
        $ownerDocument.off('mouseup', mouseUp);
    };

    const mouseMove = (event) => {
        if (operation == null) return;

        const { $movingCard } = operation;

        const offsetX = event.pageX,
            offsetY = event.pageY;

        $movingCard.css({
            top: offsetY + 'px',
            left: offsetX + 'px'
        });

        // Higlight shifts
        const _window = $ownerDocument[0].defaultView;
        const x = event.pageX;
        const y = event.pageY - _window.scrollY;

        const rowHeight = settings.lineHeight + 1;
        const rowsPerHour = settings.rowsPerHour;

        // FIXME: index not found
        const index = parseInt($movingCard.data('index'));
        console.log(settings.itemsOptions.items, index);
        const item = settings.itemsOptions.items[index];
        const duration = item.duration;
        const height = duration * (rowHeight * rowsPerHour / 60);

        $shifts.each(function () {
            const $this = $(this);
            const elementBounding = this.getBoundingClientRect();

            const matchResult = settings.itemsOptions.matchFunc(item, null);
            //console.log(matchResult);
            if (x > elementBounding.left && x < elementBounding.right
                && y > elementBounding.top && y < elementBounding.bottom
                && matchResult.match) {

                const offsetTop = y - elementBounding.top;
                const top = Math.min(
                    Math.max(0, (Math.floor(offsetTop / rowHeight) - 1) * rowHeight),
                    this.clientHeight - height
                );
                //console.log($this.find('.' + settings.itemsOptions.highlightItemCss));
                $this
                    .find('.' + settings.itemsOptions.highlightItemCss)
                    .css({ top: top })
                    .css('background-color', matchResult.color)
                    .height(height)
                    .show();

            } else {
                $this.find('.' + settings.itemsOptions.highlightItemCss).hide();
            }
        });
    };

    const mouseDownOnCard = (event /*: MouseEvent */) => {
        if (event.which !== 1) { return; }

        const $skedulerWrapper = $(`.${settings.skedulerWrapperCssClass}`);
        const $card = $(event.currentTarget);

        const $movingCard =
            $card.clone()
                .addClass(`${settings.itemsOptions.itemCardCssClass}-moving`)
                .removeClass(`${settings.itemsOptions.itemCardCssClass}-pinned`)
                .width($card.width())
                .appendTo($skedulerWrapper);

        //var bounce = $card[0].getBoundingClientRect();
        // fixme ^^^
        const offsetX = event.pageX,
            offsetY = event.pageY;

        $movingCard.css({
            top: offsetY + 'px',
            left: offsetX + 'px'
        });

        operation = {
            $card, $movingCard
        };

        $card.hide();

        $ownerDocument.on('mousemove', mouseMove);
        $ownerDocument.on('mouseup', mouseUp);

        event.preventDefault();
    };

    $skedulerItemsEl.find('.' + settings.itemsOptions.itemCardCssClass).on('mousedown', mouseDownOnCard);
}

export default populateSkedulerItems;