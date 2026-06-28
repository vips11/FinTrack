const router = require('express').Router()
const plaidClient = require('../plaid')
const PlaidItem = require('../models/PlaidItem')
const Transaction = require('../models/Transaction')
const Category = require('../models/Category')
const { CountryCode, Products } = require('plaid')
const { categorizeTransaction } = require('../utils/categorization')

router.post('/create-link-token', async (req, res) => {
  try {
    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: req.uid },
      client_name: 'Financial Tracker',
      products: [Products.Transactions],
      country_codes: [CountryCode.Ca],
      language: 'en',
      webhook: process.env.WEBHOOK_URL || undefined,
    })
    res.json({ link_token: response.data.link_token })
  } catch (err) {
    console.error('Link token error:', err.response?.data || err.message)
    res.status(500).json({ error: 'Failed to create link token' })
  }
})

router.post('/exchange-token', async (req, res) => {
  try {
    const { public_token, metadata } = req.body
    console.log('Exchanging token, metadata:', metadata?.institution?.name)
    const response = await plaidClient.itemPublicTokenExchange({ public_token })
    const { access_token, item_id } = response.data
    console.log('Got access token, item_id:', item_id)

    await PlaidItem.create({
      uid: req.uid,
      accessToken: access_token,
      itemId: item_id,
      institutionId: metadata?.institution?.institution_id,
      institutionName: metadata?.institution?.name,
    })
    console.log('PlaidItem saved')

    await syncTransactions(req.uid, access_token, null)
    res.json({ success: true })
  } catch (err) {
    console.error('Exchange error:', err.response?.data || err.message)
    res.status(500).json({ error: 'Failed to exchange token' })
  }
})

router.post('/sync', async (req, res) => {
  try {
    const items = await PlaidItem.find({ uid: req.uid })
    console.log('Found plaid items:', items.length)
    for (const item of items) {
      await syncTransactions(req.uid, item.accessToken, item.cursor)
    }
    res.json({ success: true })
  } catch (err) {
    console.error('Sync error:', err.response?.data || err.message)
    res.status(500).json({ error: 'Sync failed' })
  }
})

router.get('/accounts', async (req, res) => {
  const items = await PlaidItem.find({ uid: req.uid }).select('institutionName institutionId createdAt')
  res.json(items)
})

router.delete('/accounts/:id', async (req, res) => {
  const item = await PlaidItem.findOneAndDelete({ _id: req.params.id, uid: req.uid })
  if (item) {
    try { await plaidClient.itemRemove({ access_token: item.accessToken }) } catch {}
  }
  res.status(204).end()
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
    console.log('Sync response - added:', added.length, 'modified:', modified.length, 'removed:', removed.length)

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
