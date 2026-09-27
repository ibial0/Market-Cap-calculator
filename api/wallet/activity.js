// ═══════════════════════════════════════════════════════════
//  Vercel Serverless Function: /api/wallet/activity
//  Fetches wallet asset transfer history via Alchemy.
//  ALCHEMY_API_KEY is NEVER exposed to the browser.
// ═══════════════════════════════════════════════════════════

const SUPPORTED_NETWORKS = {
  ethereum:  { id: 'eth-mainnet',     name: 'Ethereum',  explorer: 'https://etherscan.io/tx/' },
  bnb:       { id: 'bnb-mainnet',     name: 'BNB Chain', explorer: 'https://bscscan.com/tx/' },
  base:      { id: 'base-mainnet',    name: 'Base',      explorer: 'https://basescan.org/tx/' },
  arbitrum:  { id: 'arb-mainnet',     name: 'Arbitrum',  explorer: 'https://arbiscan.io/tx/' },
  polygon:   { id: 'polygon-mainnet', name: 'Polygon',   explorer: 'https://polygonscan.com/tx/' },
  optimism:  { id: 'opt-mainnet',     name: 'Optimism',  explorer: 'https://optimistic.etherscan.io/tx/' },
};

const EVM_ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

function alchemyBase(networkId, apiKey) {
  return `https://${networkId}.g.alchemy.com/v2/${apiKey}`;
}

async function fetchChainActivity(address, networkId, networkLabel, explorerBase, apiKey, pageKey) {
  const base = alchemyBase(networkId, apiKey);

  const params = {
    fromBlock: '0x0',
    toBlock: 'latest',
    withMetadata: true,
    excludeZeroValue: true,
    maxCount: '0x19', // 25
    category: ['external', 'erc20', 'erc721', 'erc1155', 'specialnft'],
  };

  if (pageKey) params.pageKey = pageKey;

  // Outgoing
  const outRes = await fetch(`${base}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: 1, jsonrpc: '2.0',
      method: 'alchemy_getAssetTransfers',
      params: [{ ...params, fromAddress: address }],
    }),
    signal: AbortSignal.timeout(15000),
  });

  // Incoming
  const inRes = await fetch(`${base}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: 2, jsonrpc: '2.0',
      method: 'alchemy_getAssetTransfers',
      params: [{ ...params, toAddress: address }],
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!outRes.ok || !inRes.ok) {
    const status = !outRes.ok ? outRes.status : inRes.status;
    if (status === 429) throw Object.assign(new Error('RATE_LIMIT'), { code: 'RATE_LIMIT' });
    throw new Error(`Alchemy HTTP ${status}`);
  }

  const outJson = await outRes.json();
  const inJson  = await inRes.json();

  const outTransfers = outJson?.result?.transfers ?? [];
  const inTransfers  = inJson?.result?.transfers  ?? [];

  const normalize = (t, direction) => ({
    hash:      t.hash,
    blockNum:  t.blockNum,
    from:      t.from,
    to:        t.to,
    asset:     t.asset,
    value:     t.value,
    category:  t.category,
    direction,
    timestamp: t.metadata?.blockTimestamp ?? null,
    network:   networkId,
    networkLabel,
    explorerUrl: explorerBase + t.hash,
    rawContract: t.rawContract ?? null,
    tokenId:   t.tokenId ?? null,
  });

  const all = [
    ...outTransfers.map(t => normalize(t, 'sent')),
    ...inTransfers.map(t => normalize(t, 'received')),
  ].sort((a, b) => {
    if (!a.timestamp || !b.timestamp) return 0;
    return new Date(b.timestamp) - new Date(a.timestamp);
  });

  return all;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ALCHEMY_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const { address, network, pageKey } = req.body ?? {};

  const clean = typeof address === 'string' ? address.trim().toLowerCase() : '';
  if (!EVM_ADDRESS_RE.test(clean)) {
    return res.status(400).json({ error: 'Invalid EVM wallet address' });
  }

  const networksToQuery =
    network === 'all'
      ? Object.values(SUPPORTED_NETWORKS)
      : network && SUPPORTED_NETWORKS[network]
        ? [SUPPORTED_NETWORKS[network]]
        : null;

  if (!networksToQuery) {
    return res.status(400).json({ error: 'Unsupported network' });
  }

  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  const results = await Promise.allSettled(
    networksToQuery.map(net =>
      fetchChainActivity(clean, net.id, net.name, net.explorer, apiKey, pageKey)
    )
  );

  const succeeded = [];
  const failed    = [];

  results.forEach((r, i) => {
    const net = networksToQuery[i];
    if (r.status === 'fulfilled') {
      succeeded.push({ network: net.id, networkLabel: net.name, transfers: r.value });
    } else {
      const isRL = r.reason?.code === 'RATE_LIMIT';
      failed.push({
        network: net.id,
        networkLabel: net.name,
        error: isRL ? 'Rate limit — please wait and retry.' : 'Network request failed.',
      });
    }
  });

  return res.status(200).json({ address: clean, succeeded, failed });
}
