# Usage

My CLI Application is a tool for sending a message and also for querying messages.

## Commands

- `dispatch`: Dispatch a message via Hyperlane Messaging API.
- `query`: Query messages sent from a specified chain's Mailbox.

### Dispatch

Use the `dispatch` command to send a message via Hyperlane Messaging API. Example:

```shell
node clis.js -o 31337 -m 5468697320697320526573757272656374696f6e7321 -d 80001 -u http://127.0.0.1:8545 -r 0x00000000000000000000000036FdA966CfffF8a9Cdc814f546db0e6378bFef35

### Query

Use the `query` command to search for messages sent from a specified chain's Mailbox. Example:

```shell
my-cli-app query --rpc-url YOUR_RPC_URL --contract-address CONTRACT_ADDRESS --matching-list matchingList.json

