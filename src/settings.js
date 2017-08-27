const defaultSettings = {
    // Data attributes
    headers: null,  // string[] - Array of column headers
    tasks: [],      // Task[] - Array of tasks. Required fields: 
                    // id: number, startTime: number, duration: number, column: number

    items: [],      // Item[] - Array of not-assingned tasks

    notAllocatedLabel: 'Not allocated',

    // Card template - Inner content of task card. 
    // You're able to use ${key} inside template, where key is any property from task.
    cardTemplate: '<div>${id}</div>',

    // Css classes
    skedulerWrapperCssClass: 'skeduler-wrapper',
    containerCssClass: 'skeduler-container',
    headerContainerCssClass: 'skeduler-headers',
    schedulerContainerCssClass: 'skeduler-main',
    taskPlaceholderCssClass: 'skeduler-task-placeholder',
    availableIntervalPlaceholderCssClass: 'skeduler-interval-placeholder',
    cellCssClass: 'skeduler-cell',
    resizableHandlerCssClass: 'resizable-handler',
    resizableSliderCssClass: 'resizable-slider',

    lineHeight: 30,         // height of one line in grid
    borderWidth: 1,         // width of board of grid cell
    columnWidth: 200,
    minColumnWidth: 100,

    rowsPerHour: 2,         // count of rows for one hour

    columnResizeEnabled: true, // is columns resizable

    debug: false,

    itemsOptions: {
        enabled: false,
        itemsCssClass: 'skeduler-items',
        highlightItemCss: 'si-highlight-item',
        containerSelector: "#skeduler-items",
        itemCardCssClass: 'si-card',
        itemCardTemplate: '<div>${duration}</div>',
        title: 'Items',
        onItemWillBeAssigned: () => { console.log(arguments); },
        onItemDidAssigned: () => { console.log(arguments); },
        onItemWillBeUnassigned: () => { console.log(arguments); },
        onItemDidUnassigned: () => { console.log(arguments); },
        matchFunc: () => { return { match: true } }
    }
};

export { defaultSettings };