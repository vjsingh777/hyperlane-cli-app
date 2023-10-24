```markdown
# Configuration

My CLI Application supports various configuration options that can be specified via command-line arguments.
For sending the message on to destination blockchain please provide following options:
- `--api-key`: Your Hyperlane API Key.
- `--origin-chain`: Origin chain.
- `--message`: The message to send. Must be encoded as hexadecimal
- `--destination-chain`: Destination chain.
- `--rpc-url`: Ethereum RPC URL for polling.


For querying past messages you can use the following options:
- `--contract-address`: Hyperlane Mailbox contract address.
- `--matching-list`: JSON input for querying messages.

Example usage can be found in the [Usage](usage.md) section.
