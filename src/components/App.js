import { useEffect } from "react"
import { useDispatch } from "react-redux"
import config from "../config.json"

import { loadProvider, loadNetwork, loadAccount, loadTokens, loadExchange } from "../store/interactions"


function App() {
  const dispatch = useDispatch()

  // Load Blockchain data
  const loadBlockchainData = async () => {
    // Connect Ethers to Blockchain
    const provider = loadProvider(dispatch)
    
    // Fetch current networks chainId
    const chainId = await loadNetwork(provider, dispatch)
    
    // Fetch current account and balance from Metamask
    await loadAccount(provider, dispatch)

    // Token smart contract
    const token1 = config[chainId].token1
    const mETH = config[chainId].mETH
    await loadTokens(provider, [token1.address, mETH.address], dispatch)

    // Load exchange contract
    const exchangeConfig = config[chainId].exchange
    await loadExchange(provider, exchangeConfig.address, dispatch) 
  }

  useEffect(() => {
    loadBlockchainData()
  })

  return (
    <div>

      {/* Navbar */}

      <main className='exchange grid'>
        <section className='exchange__section--left grid'>

          {/* Markets */}

          {/* Balance */}

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
