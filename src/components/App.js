import { useEffect } from "react"
import { useDispatch } from "react-redux"
import config from "../config.json"

import { loadProvider, loadNetwork, loadAccount, loadTokens, loadExchange, subscribeToEvents } from "../store/interactions"
import Navbar from "./Navbar"
import Markets from "./Markets"
import Balance from "./Balance"


function App() {
  const dispatch = useDispatch()

  // Load Blockchain data
  const loadBlockchainData = async () => {
    // Connect Ethers to Blockchain
    const provider = loadProvider(dispatch)
    
    // Fetch current networks chainId (Hardhat: 31337, Goerli: 5)
    const chainId = await loadNetwork(provider, dispatch)

    // Reload page when network changes
    window.ethereum.on("chainChanged", () => {
      window.location.reload()
    })
    
    // Fetch current account and balance from Metamask when changed
    window.ethereum.on("accountsChanged", async () => {
      await loadAccount(provider, dispatch)
    })

    // Token smart contract
    const token1 = config[chainId].token1
    const mETH = config[chainId].mETH
    await loadTokens(provider, [token1.address, mETH.address], dispatch)

    // Load exchange contract
    const exchangeConfig = config[chainId].exchange
    const exchange = await loadExchange(provider, exchangeConfig.address, dispatch)

    // Listen to events
    subscribeToEvents(exchange, dispatch)
  }

  useEffect(() => {
    loadBlockchainData()
  })

  return (
    <div>

      <Navbar />

      <main className='exchange grid'>
        <section className='exchange__section--left grid'>

          <Markets />

          <Balance />

          {/* Order */}

        </section>
        <section className='exchange__section--right grid'>

          {/* PriceChart */}

          {/* Transactions */}

          {/* Trades */}

          {/* OrderBook */}

        </section>
      </main>

      {/* Alert */}

    </div>
  );
}

export default App
