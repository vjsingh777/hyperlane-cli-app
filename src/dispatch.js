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
const programSend = new commander_1.Command();
programSend.command('send')
    .name('dispatch-message')
    .description('Sends a message to Destination Hyperlane Contract on Destination Chain');
programSend
    .requiredOption('-o, --originChain <originChain>', 'Origin chain')
    .requiredOption('-m, --message <message>', 'The message to send')
    .requiredOption('-d, --destinationChain <destinationChain>', 'Destination chain')
    .requiredOption('-u, --rpcUrl <rpcUrl>', 'RPC URL')
    .requiredOption('-r, --recipientAddress <recipientAddress>', 'Recipient Address')
    //.option('-l, --matchingList <matchingList>', 'MatchingList JSON')
    .parse(process.argv);
const reqOpts = programSend.opts();
console.log(`originChain : ${reqOpts.originChain}`);
console.log(`destinationChain : ${reqOpts.destinationChain}`);
console.log(`rpcUrl : ${reqOpts.rpcUrl}`);
console.log(`recipientAddress : ${reqOpts.recipientAddress}`);
//console.log(`matchingList : ${reqOpts.matchingList}`);
const mailboxABI = [
    "function dispatch(uint32 destinationDomain, bytes32 recipient, bytes calldata message) returns (bytes32)",
    "event DispatchId(bytes32 indexed messageId)",
];
const igpABI = [
    "function payForGas(bytes32 _messageId, uint32 _destinationDomain, uint256 _gasAmount, address _refundAddress) payable",
    "function quoteGasPayment(uint32 _destinationDomain, uint256 _gasAmount) public view returns (uint256)",
];
const provider = new ethers_1.ethers.JsonRpcProvider(reqOpts.rpcUrl);
// The private key must be taken from AWS KSM but here i am using hex 
const wallet = new ethers_1.ethers.Wallet('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');
const signer = wallet.connect(provider);
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        if (reqOpts.originChain && reqOpts.message && reqOpts.rpcUrl && reqOpts.destinationChain && reqOpts.recipientAddress) {
            try {
                // Step 1: Dispatch the message  via Testnet Core contract address. Fixing it instead of parameterizing it
                const mailboxContract = new ethers_1.ethers.Contract("0xCC737a94FecaeC165AbCf12dED095BB13F037685", mailboxABI, signer);
                var messageId = "";
                if (reqOpts.recipientAddress) {
                    const dispatchTx = yield mailboxContract.dispatch(reqOpts.destinationChain, reqOpts.recipientAddress, ethers_1.ethers.hexlify(ethers_1.ethers.toUtf8Bytes(reqOpts.message)));
                    const dispatchReceipt = yield dispatchTx.wait();
                    console.log(`Sent message with dispatchTx Hash ${dispatchTx.hash}`);
                    console.log("dispatchReceipt", dispatchReceipt);
                    // Step 2: Get messageId to pay Interchain Gas fee
                    if (dispatchReceipt.status === 1) {
                        // Retrieve the message Id from the event
                        console.log("Getting MessageId for dispatched message");
                        messageId = yield getMessageId(dispatchReceipt.logs, mailboxABI);
                        if (messageId != undefined) {
                            console.log(`Message dispatched successfully. Message ID: ${messageId}`);
                        }
                        else {
                            console.log(`MessageId : ${messageId}`);
                            console.log('Message ID was not found in the event.');
                        }
                    }
                }
                // Step 3: Pay Gas fee for Interchain message transfer
                const igpContract = new ethers_1.ethers.Contract('0xF90cB82a76492614D07B82a7658917f3aC811Ac1', igpABI, signer);
                const gasQuote = ethers_1.ethers.isHexString(yield igpContract.quoteGasPayment(reqOpts.destinationChain, 100000));
                console.log(`Gas Quote = : ${gasQuote}`);
                const igpTx = yield igpContract.payForGas(messageId, reqOpts.destinationChain, 100000, yield signer.getAddress(), { value: gasQuote });
                yield igpTx.wait();
                // Step 4: Poll for delivery status
                const deliveryStatus = yield pollDelivery(mailboxContract, messageId);
                if (deliveryStatus) {
                    console.log('Message delivered successfully on the destination chain.');
                }
                else {
                    console.log('Message delivery failed.');
                }
            }
            catch (error) {
                console.error('Error dispatching message:', error);
            }
        }
        else {
            console.log('Please provide valid options. Use --help for usage information.');
        }
    });
}
function getMessageId(logs, mailBoxABI) {
    return __awaiter(this, void 0, void 0, function* () {
        const mailboxInterface = new ethers_1.ethers.Interface(mailBoxABI);
        for (const log of logs) {
            try {
                const parsedLog = yield mailboxInterface.parseLog(log);
                if (parsedLog != null && parsedLog.name === "DispatchId") {
                    return parsedLog.args.messageId;
                }
            }
            catch (error) {
                console.error('Error getting messageId:', error);
            }
        }
        return undefined;
    });
}
function pollDelivery(mailboxContract, messageId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Use the contract delivered method to check the delivery status
            const msgDelivered = yield mailboxContract.delivered(messageId);
            if (msgDelivered) {
                console.log(`Message with id: ${messageId} has been delivered successfully! to recipient :${reqOpts.recipientAddress}`);
            }
            else {
                console.log(`Message with id: ${messageId} has NOT been delivered yet! to the recipient :${reqOpts.recipientAddress}`);
            }
            return msgDelivered;
        }
        catch (error) {
            console.error('Error checking delivery status:', error);
            return false;
        }
    });
}
main();
