const compileTemplate = (template, funcs) => item => {
    let result = template;
    const regKeys = /\$\{(\w+)\}/g;
    const regFuncs = /\$\{(\w+)\(\)\}/g;

    let match = 1;
    while (true) {
        match = regKeys.exec(template);
        if (!match) break;

        let key = match[1];
        if (item.hasOwnProperty(key)) {
            result = result.replace(match[0], item[key]);
        }
    }

    while (funcs) {
        match = regFuncs.exec(template);
        if (!match) break;

        let key = match[1];
        if (funcs.hasOwnProperty(key)) {
            result = result.replace(match[0], funcs[key](item));
        }
    }

    return result;
}

export default { compileTemplate };