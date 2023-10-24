#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const ethers_1 = require("ethers");
const programSearch = new commander_1.Command();
programSearch
    .name('search-messages')
    .description('Searches Dispatched messages in last 1 million block');
programSearch.requiredOption('-u, --rpcUrl <rpcUrl>', 'RPC URL')
    .requiredOption('-l, --matchingList <matchingList>', 'MatchingList JSON')
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
const provider = new ethers_1.ethers.JsonRpcProvider(reqSearchOpts.rpcUrl);
// The private key must be taken from AWS KSM but here i am using hex 
const wallet = new ethers_1.ethers.Wallet('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');
const signer = wallet.connect(provider);
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        if (reqSearchOpts.matchingList) {
            //const matchingList = JSON.parse(reqSearchOpts.matchingList);
            //console.log(`matchingList is : ${matchingList}`);
            yield queryMessages(provider, reqSearchOpts.matchingList);
        }
        else {
            console.log('Please provide valid options. Use --help for usage information.');
        }
    });
}
function queryMessages(provider, matchingList) {
    return __awaiter(this, void 0, void 0, function* () {
        /** Actually the way i would like to do this is loop through the Matching list elements of Destination Domain and
         * then scanning Dispatch events on those destination Domains, for other params mentioned in MatchingList */
        try {
            // Fetch logs matching the filter within the last one million blocks
            let etherscanProvider = new ethers_1.ethers.EtherscanProvider(80001);
            const endBlock = yield etherscanProvider.getBlockNumber();
            console.log(`endBlock is : ${endBlock} for network 80001`);
            var startBlock = 0;
            if (endBlock - 1000000 >= 0) {
                startBlock = endBlock - 1000000;
            }
            const range = 3000; // Because least an established chain (Polygon) can deal with is 3000 blocks
            let logs = [];
            for (let i = startBlock; i <= endBlock; i += range) {
                const frmBlock = i;
                const toBlock = Math.min(i + range - 1, endBlock);
                console.log(`frmBlock: ${i} to toBlock  ${toBlock} `);
                for (let j = 0; j < matchingList.length - 1; j++) {
                    const logChunk = yield provider.getLogs({
                        address: matchingList[j].senderAddress,
                        topics: [ethers_1.ethers.id('Dispatch(uint32,bytes32,bytes)')],
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
        }
        catch (error) {
            console.error('Error querying messages:', error);
        }
    });
}
main();
