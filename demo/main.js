$(function() {
    var skeduler;

    var toMinutes = function(interval) {
        return parseInt(interval.split(':')[0]) * 60 + parseInt(interval.split(':')[1]);
    }

    var matchFunc = function(item, interval, offsetInMinutes) {
        var success = { match: true, color: 'blue' };
        var unsuccess = { match: false, color: 'red' };

        var intervalStartInMinusets = toMinutes(interval.start);
        var intervalEndInMinusets = toMinutes(interval.end);

        var start = intervalStartInMinusets + offsetInMinutes;
        var end = start + item.duration;

        if (item.interval) {
            var itemStartInMinusets = toMinutes(item.interval.start);
            var itemEndInMinusets = toMinutes(item.interval.end);

            return itemStartInMinusets == start && itemEndInMinusets == end ?
                success :
                unsuccess;
        } else {
            return item.duration <= intervalEndInMinusets - intervalStartInMinusets ?
                success :
                unsuccess;
        }

        return unsuccess;
    }

    var onItemWillBeAssigned = function() {
        console.log('skeduler :: onItemWillBeAssigned');
        console.log(skeduler.tasks());
        //console.log(arguments);
    }

    var onItemDidAssigned = function() {
        console.log('skeduler :: onItemDidAssigned');
        console.log(skeduler.tasks());
        //console.log(arguments);
    }

    var onItemWillBeUnassigned = function() {
        console.log('skeduler :: onItemWillBeUnassigned');
        console.log(skeduler.tasks());
        //console.log(arguments);
    }

    var onItemDidUnassigned = function() {
        console.log('skeduler :: onItemDidUnassigned');
        console.log(skeduler.tasks());
        //console.log(arguments);
    }

    var populate = function(data, itemCardTemplate, cardTemplate) {
        skeduler = $("#skeduler-container").skeduler({
            debug: true,
            rowsPerHour: 2,
            lineHeight: 20,
            getHeader: item => item.name,
            data: data.specialists,
            tasks: data.tasks,
            items: data.items,
            cardTemplate: cardTemplate,
            itemsOptions: {
                enabled: true,
                containerSelector: "#skeduler-items",
                itemCardTemplate: itemCardTemplate,
                matchFunc: matchFunc,
                onItemWillBeAssigned: onItemWillBeAssigned,
                onItemDidAssigned: onItemDidAssigned,
                onItemWillBeUnassigned: onItemWillBeUnassigned,
                onItemDidUnassigned: onItemDidUnassigned
            }
        });

        document.getElementsByName('rows')[0].onchange = function(e) {
            skeduler.setRowsPerHour(e.target.value);
        }

        document.getElementsByName('resizeAllColumns')[0].onchange = function(e) {
            skeduler.setResizeAllColumns(e.target.checked);
        }
    };

    var cardTemplateLoaded = function(itemCardTemplate, cardTemplate) {
        $.getJSON('demo/data.json', function(data) {
            populate(data, itemCardTemplate, cardTemplate);
        });
    };

    var itemCardTemplateLoaded = function(itemCardTemplate) {
        $.get('demo/card-template.html', function(cardTemplate) {
            cardTemplateLoaded(itemCardTemplate, cardTemplate);
        });
    };

    $.get('demo/item-card-template.html', itemCardTemplateLoaded);
});