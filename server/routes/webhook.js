const router = require('express').Router()
const PlaidItem = require('../models/PlaidItem')
const Category = require('../models/Category')
const Transaction = require('../models/Transaction')
const plaidClient = require('../plaid')
const { categorizeTransaction } = require('../utils/categorization')

// Plaid sends webhooks here — no auth middleware (Plaid can't send our Firebase token)
router.post('/', async (req, res) => {
  const { webhook_type, webhook_code, item_id } = req.body
  console.log('Plaid webhook:', webhook_type, webhook_code, item_id)

  if (webhook_type === 'TRANSACTIONS') {
    const item = await PlaidItem.findOne({ itemId: item_id })
    if (!item) return res.status(200).json({ received: true })

    if (['SYNC_UPDATES_AVAILABLE', 'INITIAL_UPDATE', 'HISTORICAL_UPDATE', 'DEFAULT_UPDATE'].includes(webhook_code)) {
      await syncTransactions(item.uid, item.accessToken, item.cursor)
    }
  }

  res.status(200).json({ received: true })
})

async function syncTransactions(uid, accessToken, cursor) {
  let hasMore = true
  let nextCursor = cursor
  const categories = await Category.find({ uid })

  while (hasMore) {
    const response = await plaidClient.transactionsSync({
      access_token: accessToken,
      cursor: nextCursor || undefined,
    })

    const { added, modified, removed, has_more, next_cursor } = response.data
    console.log('Webhook sync - added:', added.length, 'modified:', modified.length, 'removed:', removed.length)

    for (const tx of added) {
      const exists = await Transaction.findOne({ uid, plaidTransactionId: tx.transaction_id })
      if (!exists) {
        const { categoryId, recurring } = categorizeTransaction(tx.name || tx.merchant_name, categories)
        await Transaction.create({
          uid,
          amount: Math.abs(tx.amount),
          type: tx.amount > 0 ? 'expense' : 'income',
          categoryId,
          date: tx.date,
          note: tx.name,
          source: 'plaid',
          merchantName: tx.merchant_name,
          accountId: tx.account_id,
          pending: tx.pending,
          recurring,
          plaidTransactionId: tx.transaction_id,
        })
      }
    }

    for (const tx of modified) {
      await Transaction.findOneAndUpdate(
        { uid, plaidTransactionId: tx.transaction_id },
        { amount: Math.abs(tx.amount), type: tx.amount > 0 ? 'expense' : 'income', date: tx.date, note: tx.name, merchantName: tx.merchant_name, pending: tx.pending }
      )
    }

    for (const tx of removed) {
      await Transaction.findOneAndDelete({ uid, plaidTransactionId: tx.transaction_id })
    }

    hasMore = has_more
    nextCursor = next_cursor
  }

  await PlaidItem.findOneAndUpdate({ uid, accessToken }, { cursor: nextCursor })
}

module.exports = router
