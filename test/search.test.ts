import { expect } from 'chai';
import sinon from 'sinon';
import { ethers, JsonRpcProvider } from 'ethers';

import { queryMessages } from './src/'; 

describe('Search Messages CLI', function () {
  describe('queryMessages', function () {
    it('should query messages and find matching Dispatch events', async function () {
      
      const ethersEtherscanProviderStub = sinon.createStubInstance(ethers.EtherscanProvider);
      ethersEtherscanProviderStub.getBlockNumber.resolves(123456789);
      ethersEtherscanProviderStub.getLogs.onCall(999999).returns([
        // sample log data
        {
          
        },
      ]);
      sinon.stub(ethers, 'EtherscanProvider').returns(ethersEtherscanProviderStub);

      const consoleLogSpy = sinon.spy(console, 'log');

      const matchingList = [
        {
          senderAddress: '0x12345',
          destinationDomain:["80001"],
          recipientAddress:"*"
        },
      ];

      await queryMessages(matchingList);
      
      sinon.assert.callCount(consoleLogSpy, 1000000)
      sinon.restore(); 
      consoleLogSpy.restore();
    });

    // Add more test cases for different scenarios...like:
    // 1. domain where minimum block size is less then 3000 then how does the code behave around edges
    // 2. When the network performance is super sluggish what will application do? continue to wait untill infinity? or timeout after a day


  });
});
