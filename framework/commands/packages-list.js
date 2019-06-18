const http = require('axios');
var Table = require('cli-table');

// instantiate
var table = new Table({
    chars: { 'mid': '', 'left-mid': '', 'mid-mid': '', 'right-mid': '' },

    chars: {
        'top': '', 'top-mid': '', 'top-left': '', 'top-right': ''
        , 'bottom': '', 'bottom-mid': '', 'bottom-left': '', 'bottom-right': ''
        , 'left': '', 'left-mid': '', 'mid': '', 'mid-mid': ''
        , 'right': '', 'right-mid': '', 'middle': ' '
    },

    chars: {
        'top': '═', 'top-mid': '╤', 'top-left': '╔', 'top-right': '╗'
        , 'bottom': '═', 'bottom-mid': '╧', 'bottom-left': '╚', 'bottom-right': '╝'
        , 'left': '║', 'left-mid': '╟', 'mid': '─', 'mid-mid': '┼'
        , 'right': '║', 'right-mid': '╢', 'middle': '│'
    },
    head: [cli.green('Package'), cli.green('Description')],
    colWidths: [30, 120],
});


async function previewAvailablePackages() {
    let found = true,
        from = 0;
    while (found) {
        let response = await http.get(`http://npmsearch.com/query?q=flk&fields=name,description&from=${from}`);
        found = response.data.results.length > 0;

        if (! found) break;

        let rows = [];

        for (let $package of response.data.results) {
            let packageName = $package.name[0],
                packageDescription = $package.description[0];
                
            if (! packageName.startsWith('flk-')) continue;

            if (packageName == 'flk-parser') continue;

            rows.push([cli.cyan(packageName), cli.yellow(packageDescription)]);
        }

        // table is an Array, so you can `push`, `unshift`, `splice` and friends
        table.push(...rows);

        echo.sameLine(table.toString());
        from += 10;
    }

    die();
}

module.exports = function (command) {
    previewAvailablePackages(command);
}