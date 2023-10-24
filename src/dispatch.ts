#!/usr/bin/env node
import { Command, CommanderError } from 'commander';
import axios from 'axios';
import { ethers, JsonRpcProvider, Wallet } from 'ethers';
import { Log } from '@ethersproject/abstract-provider';
import { exitCode } from 'process';

const programSend = new Command();


programSend.command('send')
.name('dispatch-message')
.description('Sends a message to Destination Hyperlane Contract on Destination Chain')


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
const provider = new ethers.JsonRpcProvider(reqOpts.rpcUrl);
// The private key must be taken from AWS KSM but here i am using hex 
const wallet = new ethers.Wallet('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');
const signer =  wallet.connect(provider); 


async function main() {

    if ( reqOpts.originChain && reqOpts.message && reqOpts.rpcUrl && reqOpts.destinationChain && reqOpts.recipientAddress) {

        try {
            // Step 1: Dispatch the message  via Testnet Core contract address. Fixing it instead of parameterizing it
            const mailboxContract = new ethers.Contract("0xCC737a94FecaeC165AbCf12dED095BB13F037685", mailboxABI, signer);
            var messageId = "";
            if(reqOpts.recipientAddress){
                const dispatchTx = await mailboxContract.dispatch(
                    reqOpts.destinationChain,
                    reqOpts.recipientAddress,
                    ethers.hexlify(ethers.toUtf8Bytes(reqOpts.message))
                );

                const dispatchReceipt = await dispatchTx.wait();
                console.log(`Sent message with dispatchTx Hash ${dispatchTx.hash}`);
                console.log("dispatchReceipt",dispatchReceipt);

                // Step 2: Get messageId to pay Interchain Gas fee
                if (dispatchReceipt.status === 1) {
                    // Retrieve the message Id from the event
                    console.log("Getting MessageId for dispatched message");
                    messageId = await getMessageId(dispatchReceipt.logs, mailboxABI);
                    if (messageId != undefined) {
                        console.log(`Message dispatched successfully. Message ID: ${messageId}`);
                    } else {
                        console.log(`MessageId : ${messageId}`);
                        console.log('Message ID was not found in the event.');
                    }
                }
            }

            // Step 3: Pay Gas fee for Interchain message transfer
            const igpContract = new ethers.Contract('0xF90cB82a76492614D07B82a7658917f3aC811Ac1',igpABI, signer);
            const gasQuote = ethers.isHexString(await igpContract.quoteGasPayment(reqOpts.destinationChain, 100000 ));
            console.log(`Gas Quote = : ${gasQuote}`);
            const igpTx = await igpContract.payForGas( messageId,reqOpts.destinationChain, 100000, await signer.getAddress(), { value: gasQuote });
            await igpTx.wait();


            // Step 4: Poll for delivery status
            const deliveryStatus = await pollDelivery(mailboxContract, messageId);

            if (deliveryStatus) {
                console.log('Message delivered successfully on the destination chain.');
            } else {
                console.log('Message delivery failed.');
            }
        } catch (error) {
            console.error('Error dispatching message:', error);
        }
    } else {
        console.log('Please provide valid options. Use --help for usage information.');
    }
}

async function getMessageId(logs: Log[], mailBoxABI:any) {
    const mailboxInterface = new ethers.Interface(mailBoxABI);
    for (const log of logs) {
      try {
        const parsedLog = await mailboxInterface.parseLog(log);
        if(parsedLog != null && parsedLog.name === "DispatchId") {
          return parsedLog.args.messageId;
        }
      } catch (error) {
        console.error('Error getting messageId:', error);
      }
    }
    return undefined;
  }

async function pollDelivery(mailboxContract: any, messageId:string) {

    try {
        // Use the contract delivered method to check the delivery status
        const msgDelivered = await mailboxContract.delivered(messageId);
        if(msgDelivered){
            console.log(`Message with id: ${messageId} has been delivered successfully! to recipient :${reqOpts.recipientAddress}`);
        }else {
            console.log(`Message with id: ${messageId} has NOT been delivered yet! to the recipient :${reqOpts.recipientAddress}`);
        }

        return msgDelivered;
    } catch (error) {
        console.error('Error checking delivery status:', error);
        return false;
    }
}

main();
