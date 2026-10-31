// ═══════════════════════════════════════════════════════════
//  Vercel Serverless Function: /api/wallet/prices
//  Fetches current USD prices for a list of token addresses
//  via Alchemy's Token Prices API.
//  ALCHEMY_API_KEY is never exposed to the browser.
// ═══════════════════════════════════════════════════════════

const SUPPORTED_NETWORK_IDS = new Set([
  'eth-mainnet',
  'bnb-mainnet',
  'base-mainnet',
  'arb-mainnet',
  'polygon-mainnet',
  'opt-mainnet',
]);

// Native token coingecko-style identifiers for price lookup
const NATIVE_PRICE_IDS = {
  'eth-mainnet':     'ETH',
  'base-mainnet':    'ETH',
  'arb-mainnet':     'ETH',
  'opt-mainnet':     'ETH',
  'bnb-mainnet':     'BNB',
  'polygon-mainnet': 'MATIC',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ALCHEMY_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  res.setHeader('Cache-Control', 'public, max-age=30, s-maxage=30');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  const { tokens } = req.body ?? {};
  // tokens = [{ contractAddress, network }]  or  [{ symbol, network, type:'native' }]

  if (!Array.isArray(tokens) || tokens.length === 0) {
    return res.status(400).json({ error: 'tokens array is required' });
  }

  // Guard against oversized requests
  if (tokens.length > 100) {
    return res.status(400).json({ error: 'Too many tokens in one request (max 100)' });
  }

  // Validate all network IDs
  for (const t of tokens) {
    if (t.network && !SUPPORTED_NETWORK_IDS.has(t.network)) {
      return res.status(400).json({ error: `Unsupported network: ${t.network}` });
    }
    // Prevent SSRF — ensure contractAddress is a valid hex address if supplied
    if (t.contractAddress && !/^0x[0-9a-fA-F]{40}$/.test(t.contractAddress)) {
      return res.status(400).json({ error: 'Invalid contract address format' });
    }
  }

  const prices = {};

  // ── ERC-20 tokens: use Alchemy Token Prices API ────────
  const erc20Tokens = tokens.filter(t => t.type !== 'native' && t.contractAddress && t.network);

  // Group by network for batch calls
  const byNetwork = {};
  for (const t of erc20Tokens) {
    if (!byNetwork[t.network]) byNetwork[t.network] = [];
    byNetwork[t.network].push(t.contractAddress.toLowerCase());
  }

  const priceResults = await Promise.allSettled(
    Object.entries(byNetwork).map(async ([networkId, addresses]) => {
      const url = `https://api.g.alchemy.com/prices/v1/${apiKey}/tokens/by-address`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addresses: addresses.map(addr => ({
            network: networkId,
            address: addr,
          })),
        }),
        signal: AbortSignal.timeout(12000),
      });

      if (!resp.ok) {
        if (resp.status === 429) throw Object.assign(new Error('RATE_LIMIT'), { code: 'RATE_LIMIT' });
        throw new Error(`Alchemy price API HTTP ${resp.status}`);
      }

      const json = await resp.json();
      // data is an array of { network, address, prices: [{ currency, value }] }
      const data = json?.data ?? [];
      data.forEach(item => {
        const usdEntry = item.prices?.find(p => p.currency === 'usd');
        if (usdEntry && usdEntry.value) {
          const key = `${item.network}:${item.address.toLowerCase()}`;
          prices[key] = parseFloat(usdEntry.value);
        }
      });
    })
  );

  // ── Native tokens: use Alchemy prices by symbol ────────
  const nativeTokens = tokens.filter(t => t.type === 'native' && t.network);
  const nativeSymbols = [...new Set(nativeTokens.map(t => NATIVE_PRICE_IDS[t.network]).filter(Boolean))];

  if (nativeSymbols.length > 0) {
    try {
      const url = `https://api.g.alchemy.com/prices/v1/${apiKey}/tokens/by-symbol`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols: nativeSymbols }),
        signal: AbortSignal.timeout(12000),
      });

      if (resp.ok) {
        const json = await resp.json();
        const data = json?.data ?? [];
        data.forEach(item => {
          const usdEntry = item.prices?.find(p => p.currency === 'usd');
          if (usdEntry && usdEntry.value) {
            prices[`native:${item.symbol}`] = parseFloat(usdEntry.value);
          }
        });
      }
    } catch (_) { /* non-fatal */ }
  }

  // Build response keyed by (network:address) or (native:symbol)
  const result = tokens.map(t => {
    let price = null;
    if (t.type === 'native' && t.network) {
      const sym = NATIVE_PRICE_IDS[t.network];
      price = sym ? (prices[`native:${sym}`] ?? null) : null;
    } else if (t.contractAddress && t.network) {
      price = prices[`${t.network}:${t.contractAddress.toLowerCase()}`] ?? null;
    }
    return {
      contractAddress: t.contractAddress ?? null,
      network: t.network,
      type: t.type,
      usdPrice: price,
    };
  });

  return res.status(200).json({ prices: result });
}
