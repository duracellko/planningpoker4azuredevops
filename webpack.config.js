const path = require('path');

module.exports = {
    entry: './src/PlanningPoker.ts',
    module: {
        rules: [
            {
                test: /\.tsc?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js']
    },
    output: {
        filename: 'PlanningPoker.js',
        path: path.resolve(__dirname, 'dist')
    }
};