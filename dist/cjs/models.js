"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runnerPath = exports.percentiles = exports.defaultOptions = void 0;
const path_1 = require("path");
exports.defaultOptions = {
    iterations: 1e4,
    warmup: true,
    errorThreshold: 1,
    print: true
};
exports.percentiles = [0.001, 0.01, 0.1, 1, 2.5, 10, 25, 50, 75, 90, 97.5, 99, 99.9, 99.99, 99.999];
exports.runnerPath = path_1.resolve(__dirname, './runner.js');
