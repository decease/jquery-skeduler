import Skeduler from './skeduler';

// export type Task = {
//     id: number;
//     startTime: number;
//     duration: number;
//     column: number
// }

// export type Options = {
//     headers: string[];
//     tasks: Task[];
//     containerCssClass: string;
//     headerContainerCssClass: string;
//     schedulerContainerCssClass: string;
//     lineHeight: number;
//     borderWidth: number;
// }

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
$.fn.skeduler = function (options) {
    return this.each(function () {
        let $container = $(this);
 
        var skeduler = new Skeduler($container, options);
    });
};

$.skeduler = Skeduler;
