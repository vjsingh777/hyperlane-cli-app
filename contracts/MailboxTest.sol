// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";

import {MockMailbox} from "../src/mocks/MockMailbox.sol";
import {TestRecipient} from "../src/TestRecipient.sol";

contract MailboxTest is Test {
    uint32 constant originDomain = 1000;
    uint32 constant destinationDomain = 2000;
    MockMailbox originMailbox;
    MockMailbox destinationMailbox;

    function setUp() public {
        originMailbox = new MockMailbox(originDomain);
        destinationMailbox = new MockMailbox(destinationDomain);
        originMailbox.addRemoteMailbox(destinationDomain, destinationMailbox);
        destinationMailbox.addRemoteMailbox(originDomain, originMailbox);
    }

    function testExample() public {
        TestRecipient recipient = new TestRecipient();
        bytes memory data = "This is a test message";

        originMailbox.dispatch(destinationDomain, addressToBytes32(address(recipient)), data);
        destinationMailbox.processNextInboundMessage();

        assertEq(recipient.data(), data);
    }

    function addressToBytes32(address _addr) internal pure returns (bytes32) {
        return bytes32(uint256(uint160(_addr)));
    }
}