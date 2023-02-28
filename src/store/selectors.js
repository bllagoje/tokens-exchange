import { createSelector } from "reselect"
import { fill, get, groupBy, reject, maxBy, minBy } from "lodash"
import { ethers } from "ethers"
import moment from "moment"

// CSS colors
const GREEN = "#25ce8f"
const RED = "#f45353"

const tokens = state => get(state, "tokens.contracts")
const allOrders = state => get(state, "exchange.allOrders.data", [])
const cancelledOrders = state => get(state, "exchange.cancelledOrders.data", [])
const filledOrders = state => get(state, "exchange.filledOrders.data", [])

const openOrders = state => {
    const all = allOrders(state)
    const filled = filledOrders(state)
    const cancelled = cancelledOrders(state)

    const openOrders = reject(all, (order) => {
        const orderFilled = filled.some((o) => o.id.toString() === order.id.toString())
        const orderCancelled = cancelled.some((o) => o.id.toString() === order.id.toString())
        return (orderFilled || orderCancelled)
    })

    return openOrders
}

const decorateOrder = (order, tokens) => {
    let token0Amount
    let token1Amount

    if (order.tokenGive === tokens[1].address) {
        token0Amount = order.amountGive
        token1Amount = order.amountGet
    } else {
        token0Amount = order.amountGet
        token1Amount = order.amountGive
    }

    let tokenPrice = (token1Amount / token0Amount)
    tokenPrice = Math.round(tokenPrice * 100000) / 10000

    return ({
        ...order,
        token0Amount: ethers.utils.formatUnits(token0Amount, "ether"),
        token1Amount: ethers.utils.formatUnits(token1Amount, "ether"),
        tokenPrice: tokenPrice,
        formatedTimestamp: moment.unix(order.timestamp).format('h:mm:ssa d MMM D')
    }) 
}

// -----------------------------------------------------------------
// ORDER BOOK
export const orderBookSelector = createSelector(openOrders, tokens, (orders, tokens) => {
    // console.log('orderBookSelector', orders, tokens)
    if (!tokens[0] || !tokens[1]) { return }
    // Filter orders by selected tokens
    orders = orders.filter((o) => o.tokenGet === tokens[0].address || o.tokenGet === tokens[1].address)
    orders = orders.filter((o) => o.tokenGive === tokens[0].address || o.tokenGive === tokens[1].address)

    // Decorate orders
    orders = decorateOrderBookOrders(orders, tokens)
    
    // Group orders by "orderType"
    orders = groupBy(orders, "orderType")
    
    // Fetch buy orders
    const buyOrders = get(orders, "buy", [])
    // Sort buy orders by token price
    orders = {
        ...orders,
        buyOrders: buyOrders.sort((a, b) => b.tokenPrice - a.tokenPrice)
    }

    // Fetch sell orders
    const sellOrders = get(orders, "sell", [])
    // Sort sell  orders by token price
    orders = {
        ...orders,
        sellOrders: sellOrders.sort((a, b) => b.tokenPrice - a.tokenPrice)
    }

    return orders
})

const decorateOrderBookOrders = (orders, tokens) => {
    return (
        orders.map((order) => {
            order = decorateOrder(order, tokens)
            order = decorateOrderBookOrder(order, tokens)
            return (order)
        })
    )
}

const decorateOrderBookOrder = (order, tokens) => {
    const orderType = order.tokenGive === tokens[1].address ? "buy" : "sell"

    return ({
        ...order,
        orderType,
        orderTypeClass: (orderType === "buy" ? GREEN : RED),
        orderFillAction: (orderType === "buy" ? "sell" : "buy")
    })
}

// -----------------------------------------------------------------
// PRICE CHART
export const priceChartSelector = createSelector(
    filledOrders,
    tokens,
    (orders, tokens) => {
        if (!tokens[0] || !tokens[1]) {return}

        // Filter orders by selected tokens
        orders = orders.filter((o) => o.tokenGet === tokens[0].address || o.tokenGet === tokens[1].address)
        orders = orders.filter((o) => o.tokenGive === tokens[0].address || o.tokenGive === tokens[1].address)

        // Sort orders by date asc to compare history
        orders = orders.sort((a, b) => a.timestamp - b.timestamp)
        
        // Decorate orders - add display attributes
        orders = orders.map((o) => decorateOrder(o, tokens))

        // Last two order for final price and price change
        let secondLastOrder
        let lastOrder
        [secondLastOrder, lastOrder] = orders.slice(orders.length - 2, orders.length) // Multiple assignment 
        
        // Get last order price
        const lastPrice = get(lastOrder, "tokenPrice", 0)

        // Get socond last order price
        const secondLastPrice = get(secondLastOrder, "tokenPrice", 0) 
        
        return({
            lastPrice: lastPrice,
            lastPriceChange: (lastPrice >= secondLastPrice ? "+" : "-"),
            series: [{
                data: buildGraphData(orders)
            }]
        })

    }
)

const buildGraphData = (orders) => {
    // Group the orders by hour for the graph
    orders = groupBy(orders, (o) => moment.unix(o.timestamp).startOf("hour").format())
    // Get each hour where data exists
    const hours = Object.keys(orders)

    // Build the graph series
    const graphData = hours.map((hour) => {
        // Fetch all orders from current hour
        const group = orders[hour]

        // Calc price values: open, high, low, close
        const open = group[0]
        const high = maxBy(group, "tokenPrice")
        const low = minBy(group, "tokenPrice")
        const close = group[group.length - 1]

        return ({
            x: new Date(hour),
            y: [open.tokenPrice, high.tokenPrice, low.tokenPrice, close.tokenPrice]
        })
    })

    return graphData
}