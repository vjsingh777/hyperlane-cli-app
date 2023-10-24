# Usage

Hyperlane CLI Application is a tool for sending a message and also for querying messages.

## Commands

- `dispatch`: Dispatch a message via Hyperlane Messaging API.
- `search`: Query messages sent from a specified chain's Mailbox.


### search-messages
Use the `search-messages` command to search for messages sent from a specified chain's Mailbox. Example:

```shell
ts-node search.ts -l '[{"senderAddress":"0xCC737a94FecaeC165AbCf12dED095BB13F037685","destinationDomain":["80001"],"recipientAddress":"*"}]' search-messages

### dispatch-messages
Use the `dispatch` command to send a message via Hyperlane Messaging API. Example:

```shell
ts-node clis.js -o 31337 -m 5468697320697320526573757272656374696f6e7321 -d 80001 -u http://127.0.0.1:8545 -r 0x00000000000000000000000036FdA966CfffF8a9Cdc814f546db0e6378bFef35
