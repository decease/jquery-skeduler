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

    var populate = function(data, shiftTemplate, itemCardTemplate) {
        skeduler = $("#skeduler-container").skeduler({
            debug: true,
            rowsPerHour: 2,
            lineHeight: 20,
            getHeader: function (item) { return item.name },
            data: data.specialists,
            tasks: data.tasks,
            items: data.items,
            itemsOptions: {
                enabled: true,
                containerSelector: "#skeduler-items",
                itemCardTemplate: itemCardTemplate,
                shiftTemplate: shiftTemplate,
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

    var shiftTemplateLoaded = function(shiftTemplate, itemCardTemplate) {
        $.getJSON('demo/data.json', function(data) {
            populate(data, shiftTemplate, itemCardTemplate);
        });
    };

    var cardTemplateLoaded = function(itemCardTemplate) {
        $.get('demo/shift-template.html', function(shiftTemplate) {
            shiftTemplateLoaded(shiftTemplate, itemCardTemplate);
        });
    };

    $.get('demo/item-card-template.html', cardTemplateLoaded);
});
