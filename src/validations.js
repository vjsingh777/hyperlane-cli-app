#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const ethers_1 = require("ethers");
function chkInt(value) {
    if (typeof value === "number") {
        return value;
    }
    else if (typeof value === "string") {
        const parsedValue = parseInt(value, 10);
        if (isNaN(parsedValue)) {
            throw new commander_1.CommanderError(4, "InvalidArgument", 'Passed in Argument ' + value + ' is Not a number.');
        }
        return parsedValue;
    }
    else {
        throw new commander_1.CommanderError(4, "InvalidArgument", 'Passed in Argument ' + value + ' is Not a number.');
    }
}
function isContractAddress(value) {
    if (ethers_1.ethers.isAddress(value)) {
        return true;
    }
}
