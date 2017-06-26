const defaultSettings = {
    // Data attributes
    headers: [],  // String[] - Array of column headers
    tasks: [],    // Task[] - Array of tasks. Required fields: 
    // id: number, startTime: number, duration: number, column: number

    // Card template - Inner content of task card. 
    // You're able to use ${key} inside template, where key is any property from task.
    cardTemplate: '<div>${id}</div>',

    // OnClick event handler
    onClick: function (e, task) { },

    // Css classes
    containerCssClass: 'skeduler-container',
    headerContainerCssClass: 'skeduler-headers',
    schedulerContainerCssClass: 'skeduler-main',
    taskPlaceholderCssClass: 'skeduler-task-placeholder',
    cellCssClass: 'skeduler-cell',
    resizableHandlerCssClass: 'resizable-handler',
    resizableSliderCssClass: 'resizable-slider',

    lineHeight: 30,         // height of one line in grid
    borderWidth: 1,         // width of board of grid cell
    columnWidth: 200,
    minColumnWidth: 100,

    rowsPerHour: 2,         // count of rows for one hour

    columnResizeEnabled: true, // is columns resizable

    debug: true,

    itemsOptions: {
        enabled: false
    }
};

export { defaultSettings };