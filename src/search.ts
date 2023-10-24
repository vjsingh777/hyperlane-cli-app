#!/usr/bin/env node
import { Command, CommanderError } from 'commander';
import axios from 'axios';
import { ethers, JsonRpcProvider, Wallet } from 'ethers';
import { Log } from '@ethersproject/abstract-provider';
import { exitCode } from 'process';

const programSearch = new Command();

programSearch
    .name('search-messages')
    .description('Searches Dispatched messages in last 1 million block')

programSearch.requiredOption('-l, --matchingList <matchingList>', 'MatchingList JSON')
    .parse(process.argv);

const reqSearchOpts = programSearch.opts();
console.log(`matchingList : ${reqSearchOpts.matchingList}`);


const mailboxABI = [
    "function dispatch(uint32 destinationDomain, bytes32 recipient, bytes calldata message) returns (bytes32)",
    "event DispatchId(bytes32 indexed messageId)",
];
const igpABI = [
    "function payForGas(bytes32 _messageId, uint32 _destinationDomain, uint256 _gasAmount, address _refundAddress) payable",
    "function quoteGasPayment(uint32 _destinationDomain, uint256 _gasAmount) public view returns (uint256)",
];

async function main() {

    if (reqSearchOpts.matchingList) {

        // Here i am assuming matchingList is a JSON and a correct one passed from command line! Validations would be great!
        await queryMessages(reqSearchOpts.matchingList);
    } else {
        console.log('Please provide valid options. Use --help for usage information.');
    }
}

async function queryMessages(matchingList: any[]) {
    /** Actually the way i would like to do this is loop through the Matching list elements for each Destination Domain and 
     * then scanning Dispatch events on those destination Domains, for other params mentioned in MatchingList */
    try {
        // Fetch logs matching the filter within the last one million blocks
        let etherscanProvider = new ethers.EtherscanProvider(80001);
        const endBlock = await etherscanProvider.getBlockNumber()
        console.log(`endBlock is : ${endBlock} for network 80001`);
        var startBlock = 0;
        if (endBlock - 1000000 >= 0) {
            startBlock = endBlock - 1000000;
        }
        const range = 3000; // Because least an established chain (Polygon) can deal with is 3000 blocks
        let logs: Object[] = [];
        for (let i = startBlock; i <= endBlock; i += range) {
            const frmBlock = i;
            const toBlock = Math.min(i + range - 1, endBlock);
            console.log(`frmBlock: ${i} to toBlock  ${toBlock} `);
            for (let j = 0; j < matchingList.length - 1; j++) {
                const logChunk = await etherscanProvider.getLogs({
                    address: matchingList[j].senderAddress,
                    topics: [ethers.id('Dispatch(uint32,bytes32,bytes)')],
                    fromBlock: frmBlock,
                    toBlock: toBlock
                });
                if (logChunk.length > 0) {
                    logs.push(logChunk);
                }
            }
        }

        if (logs.length === 0) {
            console.log('No matching messages found.');
            return;
        }

        for (const log of logs) {
            console.log(`Matching Dispatch event found is : ${log.toString}`);
            console.log(JSON.stringify(log, null, 2));
        }
    } catch (error) {
        console.error('Error querying messages:', error);
    }
}

main();
