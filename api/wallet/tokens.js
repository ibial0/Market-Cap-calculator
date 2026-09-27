// ═══════════════════════════════════════════════════════════
//  Vercel Serverless Function: /api/wallet/tokens
//  Fetches token balances + prices via Alchemy Portfolio API.
//  The ALCHEMY_API_KEY is NEVER sent to the browser.
// ═══════════════════════════════════════════════════════════

const SUPPORTED_NETWORKS = {
  ethereum:  { id: 'eth-mainnet',    name: 'Ethereum',    symbol: 'ETH',  explorer: 'https://etherscan.io' },
  bnb:       { id: 'bnb-mainnet',    name: 'BNB Chain',   symbol: 'BNB',  explorer: 'https://bscscan.com' },
  base:      { id: 'base-mainnet',   name: 'Base',        symbol: 'ETH',  explorer: 'https://basescan.org' },
  arbitrum:  { id: 'arb-mainnet',    name: 'Arbitrum',    symbol: 'ETH',  explorer: 'https://arbiscan.io' },
  polygon:   { id: 'polygon-mainnet',name: 'Polygon',     symbol: 'MATIC',explorer: 'https://polygonscan.com' },
  optimism:  { id: 'opt-mainnet',    name: 'Optimism',    symbol: 'ETH',  explorer: 'https://optimistic.etherscan.io' },
};

const EVM_ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

function isValidEVMAddress(addr) {
  return typeof addr === 'string' && EVM_ADDRESS_RE.test(addr);
}

// Sanitise user input — only allow hex chars + 0x prefix
function sanitizeAddress(addr) {
  if (typeof addr !== 'string') return '';
  return addr.trim().toLowerCase();
}

// Build Alchemy base URL for a given network id
function alchemyBase(networkId, apiKey) {
  return `https://${networkId}.g.alchemy.com/v2/${apiKey}`;
}

// Fetch token balances (ERC-20 + native) for one chain
async function fetchChainTokens(address, networkId, apiKey) {
  const base = alchemyBase(networkId, apiKey);

  // 1. Token balances (ERC-20)
  const balRes = await fetch(`${base}/getTokenBalances`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: 1,
      jsonrpc: '2.0',
      method: 'alchemy_getTokenBalances',
      params: [address, 'erc20'],
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!balRes.ok) {
    if (balRes.status === 429) throw Object.assign(new Error('RATE_LIMIT'), { code: 'RATE_LIMIT' });
    throw new Error(`Alchemy HTTP ${balRes.status}`);
  }

  const balJson = await balRes.json();
  const rawBalances = balJson?.result?.tokenBalances ?? [];

  // Filter zero balances
  const nonZero = rawBalances.filter(t => t.tokenBalance && t.tokenBalance !== '0x0000000000000000000000000000000000000000000000000000000000000000');

  // 2. Fetch metadata in batches of 5 to avoid hitting rate limits
  const BATCH = 5;
  const metaMap = {};
  for (let i = 0; i < nonZero.length; i += BATCH) {
    const batch = nonZero.slice(i, i + BATCH);
    const metaResults = await Promise.allSettled(
      batch.map(t =>
        fetch(`${base}/getTokenMetadata`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: 1, jsonrpc: '2.0',
            method: 'alchemy_getTokenMetadata',
            params: [t.contractAddress],
          }),
          signal: AbortSignal.timeout(10000),
        }).then(r => r.json())
      )
    );
    batch.forEach((t, idx) => {
      const res = metaResults[idx];
      if (res.status === 'fulfilled') metaMap[t.contractAddress.toLowerCase()] = res.value?.result;
    });
  }

  // 3. Build token list
  const tokens = [];
  for (const t of nonZero) {
    const meta = metaMap[t.contractAddress.toLowerCase()] ?? {};
    const decimals = meta.decimals ?? 18;
    const rawHex = t.tokenBalance;
    const rawBig = BigInt(rawHex);
    const balance = Number(rawBig) / Math.pow(10, decimals);

    // Skip obvious spam: no name, no symbol, or < 0.000001 balance
    if (!meta.name || !meta.symbol) continue;
    if (balance < 1e-9) continue;

    tokens.push({
      type: 'erc20',
      contractAddress: t.contractAddress,
      name: meta.name,
      symbol: meta.symbol,
      logo: meta.logo ?? null,
      decimals,
      balance,
      usdPrice: null,   // price fetched in /api/wallet/prices if needed
      usdValue: null,
      network: networkId,
    });
  }

  // 4. Native balance
  const nativeRes = await fetch(`${base}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: 1, jsonrpc: '2.0',
      method: 'eth_getBalance',
      params: [address, 'latest'],
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (nativeRes.ok) {
    const nativeJson = await nativeRes.json();
    const rawNative = nativeJson?.result;
    if (rawNative && rawNative !== '0x0') {
      const nativeBal = Number(BigInt(rawNative)) / 1e18;
      if (nativeBal >= 1e-9) {
        tokens.unshift({
          type: 'native',
          contractAddress: null,
          name: null,        // filled below per network
          symbol: null,
          logo: null,
          decimals: 18,
          balance: nativeBal,
          usdPrice: null,
          usdValue: null,
          network: networkId,
        });
      }
    }
  }

  return tokens;
}

// ── Main Handler ───────────────────────────────────────────
module.exports = async function handler(req, res) {
  // CORS / method guard
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ALCHEMY_API_KEY;
  if (!apiKey) {
    console.error('[wallet/tokens] ALCHEMY_API_KEY not set');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const { address, network } = req.body ?? {};

  // Validate address
  const clean = sanitizeAddress(address);
  if (!isValidEVMAddress(clean)) {
    return res.status(400).json({ error: 'Invalid EVM wallet address. Must start with 0x and be 42 characters.' });
  }

  // Validate network
  const networksToQuery =
    network === 'all'
      ? Object.values(SUPPORTED_NETWORKS)
      : network && SUPPORTED_NETWORKS[network]
        ? [SUPPORTED_NETWORKS[network]]
        : null;

  if (!networksToQuery) {
    return res.status(400).json({ error: 'Unsupported network. Use "all" or a specific supported network key.' });
  }

  // Rate-limit header (basic)
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store');

  // Query each chain concurrently, collecting partial failures gracefully
  const results = await Promise.allSettled(
    networksToQuery.map(async (net) => {
      const tokens = await fetchChainTokens(clean, net.id, apiKey);
      // Annotate native symbol/name from network config
      tokens.forEach(t => {
        if (t.type === 'native') {
          t.name   = net.name + ' Native (' + net.symbol + ')';
          t.symbol = net.symbol;
          t.networkLabel = net.name;
        } else {
          t.networkLabel = net.name;
        }
        t.explorerBase = net.explorer;
      });
      return { network: net.id, networkLabel: net.name, tokens };
    })
  );

  const succeeded = [];
  const failed    = [];

  results.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      succeeded.push(r.value);
    } else {
      const net = networksToQuery[i];
      const isRateLimit = r.reason?.code === 'RATE_LIMIT';
      failed.push({
        network: net.id,
        networkLabel: net.name,
        error: isRateLimit ? 'Rate limit reached — please wait a moment and try again.' : 'Network request failed.',
      });
    }
  });

  return res.status(200).json({
    address: clean,
    succeeded,
    failed,
    supportedNetworks: Object.entries(SUPPORTED_NETWORKS).map(([key, v]) => ({
      key,
      id: v.id,
      name: v.name,
      symbol: v.symbol,
    })),
  });
}
