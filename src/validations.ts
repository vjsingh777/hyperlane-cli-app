#!/usr/bin/env node
import { Command, CommanderError } from 'commander';
import axios from 'axios';
import { ethers, JsonRpcProvider, Wallet } from 'ethers';



function chkInt(value : any) {
    if(typeof value === "number"){
        return value
    } else if(typeof value === "string"){
        const parsedValue = parseInt(value, 10);
        if (isNaN(parsedValue)) {
            throw new CommanderError(4,"InvalidArgument",'Passed in Argument '+value+' is Not a number.');
        }
        return parsedValue;
    }else
    {
        throw new CommanderError(4,"InvalidArgument",'Passed in Argument '+value+' is Not a number.');
    }
}

function isContractAddress(value : string) {
    if(ethers.isAddress(value)){
        return true;
    }
}
