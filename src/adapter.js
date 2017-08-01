import Skeduler from './skeduler';

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
$.fn.skeduler = function(options) {
    let $container = $(this);
    var skeduler = new Skeduler($container, options);

    return skeduler;
};

$.skeduler = Skeduler;