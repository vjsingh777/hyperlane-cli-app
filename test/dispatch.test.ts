import { expect } from 'chai';
import sinon from 'sinon';
import { ethers } from 'ethers';
import { Log } from '@ethersproject/abstract-provider';

import { main, getMessageId, pollDelivery } from './dispatch'; // Replace with your actual script path

describe('Hyperlane CLI Application', function () {
  describe('main', function () {
    it('should dispatch a message and check delivery status', async function () {
      // Mock ethers.Wallet and other relevant functions
      const ethersWalletStub = sinon.createStubInstance(ethers.Wallet);
      const ethersContractStub = sinon.createStubInstance(ethers.Contract);
      // Mock ethers.Interface and simulate parsing a DispatchId log
      const ethersInterfaceStub = sinon.createStubInstance(ethers.Interface);
      ethersInterfaceStub.parseLog.returns({
        name: 'DispatchId',
        args: { messageId: '12345' },
      });
      sinon.stub(ethers, 'Wallet').returns(ethersWalletStub);
      sinon.stub(ethers, 'Contract').returns(ethersContractStub);
      sinon.stub(ethers, 'Interface').returns(ethersInterfaceStub);
      
      const consoleLogSpy = sinon.spy(console, 'log');

      // Simulate a successful dispatch and delivery status
      ethersContractStub.dispatch.resolves({ hash: '0x12345' });
      ethersContractStub.delivered.resolves(true);

      await main();

      // Assertions here...

      sinon.restore(); // Restore sinon stubs
      consoleLogSpy.restore();
    });

    // Add more test cases for different scenarios...
  });

  describe('getMessageId', function () {
    it('should extract messageId from logs', async function () {
      // Mock ethers.Interface and simulate parsing a DispatchId log
      const ethersInterfaceStub = sinon.createStubInstance(ethers.Interface);
      ethersInterfaceStub.parseLog.returns({
        name: 'DispatchId',
        args: { messageId: '12345' },
      });
      sinon.stub(ethers, 'Interface').returns(ethersInterfaceStub);
      
      const logs: Log[] = [
        // Replace with sample log data
        {
          transactionHash: '0x12345',
          blockNumber: 12345,
          data: '0x1234',
          // other fields...
        },
      ];

      const messageId = await getMessageId(logs, []);
      expect(messageId).to.equal('12345');

      sinon.restore();
    });

  });

  describe('pollDelivery', function () {
    it('should check delivery status and return true', async function () {
      // Mock ethers.Contract and simulate a successful delivery
      const ethersContractStub = sinon.createStubInstance(ethers.Contract);
      ethersContractStub.delivered.resolves(true);
      sinon.stub(ethers, 'Contract').returns(ethersContractStub);
      
      const msgDelivered = await pollDelivery(ethersContractStub, '12345');
      expect(msgDelivered).to.equal(true);

      sinon.restore(); 
    });

    it('should check delivery status and return false', async function () {
      // Mock ethers.Contract and simulate a failed delivery
      const ethersContractStub = sinon.createStubInstance(ethers.Contract);
      ethersContractStub.delivered.resolves(false);
      sinon.stub(ethers, 'Contract').returns(ethersContractStub);
      
      const msgDelivered = await pollDelivery(ethersContractStub, '12345');
      expect(msgDelivered).to.equal(false);

      sinon.restore(); 
    });

    // Add more test cases for different scenarios...
  });

});
