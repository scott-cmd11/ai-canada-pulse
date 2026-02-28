// Canadian AI stock tracker using Yahoo Finance v8 API
// Tracks publicly traded Canadian companies investing heavily in AI

const YF_BASE = "https://query1.finance.yahoo.com/v8/finance"
const CACHE_TTL = 30 * 60 * 1000 // 30 minutes

export interface StockQuote {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  currency: string
  marketCap: number | null
  exchange: string
}

export interface StocksData {
  quotes: StockQuote[]
  fetchedAt: string
}

interface CacheEntry {
  data: StocksData
  fetchedAt: number
}

let cache: CacheEntry | null = null

// Canadian companies heavily investing in AI
const CANADIAN_AI_TICKERS = [
  { symbol: "SHOP.TO", name: "Shopify" },
  { symbol: "KXS.TO", name: "Kinaxis" },
  { symbol: "CVO.TO", name: "Coveo Solutions" },
  { symbol: "OTEX.TO", name: "OpenText" },
  { symbol: "GIB-A.TO", name: "CGI Group" },
  { symbol: "BB.TO", name: "BlackBerry" },
  { symbol: "DCBO.TO", name: "Docebo" },
  { symbol: "LSPD.TO", name: "Lightspeed Commerce" },
  { symbol: "THNK.V", name: "Think Research" },
  { symbol: "MNDM.TO", name: "Mandalay Resources" },
]

export async function fetchCanadianAIStocks(): Promise<StocksData | null> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) {
    return cache.data
  }

  try {
    const symbols = CANADIAN_AI_TICKERS.map((t) => t.symbol).join(",")
    const res = await fetch(
      `${YF_BASE}/spark?symbols=${symbols}&range=1d&interval=1d`,
      {
        headers: {
          "User-Agent": "AICanadaPulse/1.0",
        },
      }
    )

    if (!res.ok) {
      // Fallback: try quote endpoint
      return await fetchViaQuoteEndpoint()
    }

    const json = await res.json()
    const quotes: StockQuote[] = []

    for (const ticker of CANADIAN_AI_TICKERS) {
      const spark = json[ticker.symbol]
      if (!spark) continue

      const close = spark.close ?? []
      const prevClose = spark.previousClose ?? spark.chartPreviousClose
      const currentPrice = close[close.length - 1] ?? 0
      const change = prevClose ? currentPrice - prevClose : 0
      const changePercent = prevClose ? (change / prevClose) * 100 : 0

      quotes.push({
        symbol: ticker.symbol,
        name: ticker.name,
        price: Math.round(currentPrice * 100) / 100,
        change: Math.round(change * 100) / 100,
        changePercent: Math.round(changePercent * 100) / 100,
        currency: "CAD",
        marketCap: null,
        exchange: "TSX",
      })
    }

    if (quotes.length === 0) return await fetchViaQuoteEndpoint()

    const data: StocksData = {
      quotes,
      fetchedAt: new Date().toISOString(),
    }
    cache = { data, fetchedAt: Date.now() }
    return data
  } catch (err) {
    console.warn("[stocks-client] Spark endpoint failed, trying quote:", err)
    return await fetchViaQuoteEndpoint()
  }
}

async function fetchViaQuoteEndpoint(): Promise<StocksData | null> {
  try {
    const symbols = CANADIAN_AI_TICKERS.map((t) => t.symbol).join(",")
    const res = await fetch(
      `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${symbols}`,
      {
        headers: { "User-Agent": "AICanadaPulse/1.0" },
      }
    )

    if (!res.ok) return cache?.data ?? null

    const json = await res.json()
    const results = json.quoteResponse?.result ?? []

    const quotes: StockQuote[] = results.map((q: Record<string, unknown>) => {
      const ticker = CANADIAN_AI_TICKERS.find((t) => t.symbol === q.symbol)
      return {
        symbol: (q.symbol as string) || "",
        name: ticker?.name || (q.shortName as string) || "",
        price: Math.round(((q.regularMarketPrice as number) || 0) * 100) / 100,
        change: Math.round(((q.regularMarketChange as number) || 0) * 100) / 100,
        changePercent: Math.round(((q.regularMarketChangePercent as number) || 0) * 100) / 100,
        currency: (q.currency as string) || "CAD",
        marketCap: (q.marketCap as number) || null,
        exchange: (q.exchange as string) || "TSX",
      }
    })

    const data: StocksData = {
      quotes,
      fetchedAt: new Date().toISOString(),
    }
    cache = { data, fetchedAt: Date.now() }
    return data
  } catch (err) {
    console.warn("[stocks-client] Quote endpoint failed:", err)
    return cache?.data ?? null
  }
}
