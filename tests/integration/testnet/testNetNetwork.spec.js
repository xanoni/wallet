const TestUtil = require('../../utils/TestUtils')
const puppeteer = require('puppeteer')
const log = console.log
const expect = require('chai').expect
const assert = require('chai').assert
const chalk = require('chalk')

const testUtil = new TestUtil()

let browser
let page
const password = '123123123'

describe('Liquality wallet...', async () => {
  // Chrome options
  const options = {
    slowMo: 20,
    headless: false,
    ignoreHTTPSErrors: true,
    executablePath: process.env.PUPPETEER_EXEC_PATH, // set by docker container
    args: [
      '--no-sandbox',
      '--disable-extensions-except=' + testUtil.extensionPathBuildPath,
      '--load-extension=' + testUtil.extensionPathBuildPath
    ]
  }

  beforeEach(async () => {
    browser = await puppeteer.launch(options)
    page = await browser.newPage()
    await page.goto(testUtil.extensionRootUrl)
  })

  // after each hook
  afterEach(async () => {
    page.on('pageerror', errors => {
      if (errors.length) {
        const errorReports = errors.map((err) => err.message)
        const errorMessage = `Errors found in browser console:\n${errorReports.join(
          '\n'
        )}`
        console.error(new Error(errorMessage))
      }
    })
    await browser.close()
  })

  it('Create a new wallet with 12 words', async () => {
    // Accept terms
    await page.waitForSelector('#terms_privacy_accept_button', {
      visible: true
    })
    await page.click('#terms_privacy_accept_button')
    log(chalk.greenBright('User click on Terms & Privacy accept option'))

    // Create new wallet
    await page.click('#create_new_wallet_option')
    log(chalk.greenBright('User click on create new wallet option'))
    // Set password
    await page.type('#password', password)
    await page.type('#confirmPassword', password)
    log(chalk.greenBright('User set the password & confirmed'))
    await page.click('#next_button')
    log(chalk.green.underline.bold('User submit password details :)'))
    // Unlocking wallet...
    await page.waitForSelector('#backup-wallet_seed_wordlist')
    const allSeedPhases = await page.$$eval('#backup_seed_word', elements => elements.map(item => item.textContent))
    console.log(allSeedPhases)

    const seed1 = allSeedPhases[0]
    const seed5 = allSeedPhases[4]
    const seed12 = allSeedPhases[11]

    await page.click('#backup_your_wallet_next_button') // Next
    // Confirm seed phase
    console.log('Confirm Seed Phrase view has been loaded')

    const firstWord = await page.$x(`//button[text()='${seed1}']`)
    await firstWord[0].click()
    console.log('User enter 1st seed word')

    const fifthWord = await page.$x(`//button[text()='${seed5}']`)
    await fifthWord[0].click()
    console.log('User enter 5th seed word')

    const twelveWord = await page.$x(`//button[text()='${seed12}']`)
    await twelveWord[0].click()
    console.log('User enter 12th seed word')

    // continue
    await page.click('#seed_phrase_continue', { delay: 100 })

    // overview page
    await page.waitForSelector('#overview', {
      visible: true
    })

    await page.click('#head_network')
    await page.waitForSelector('#testnet_network', {
      visible: true
    })
    console.log('user successfully logged in')
    await page.click('#testnet_network')
    const overviewElement = await page.$('.text-muted')
    const overviewText = await (await overviewElement.getProperty('innerText')).jsonValue()
    expect(overviewText, 'Testnet overview header').contain('TESTNET')
    console.log('user successfully changed to TESTNET')
    // check Send & Swap & Receive options have been displayed
    await page.waitForSelector('#send_action', {
      visible: true
    })
    await page.waitForSelector('#swap_action', {
      visible: true
    })
    await page.waitForSelector('#receive_action', {
      visible: true
    })

    // validate the testnet asserts count
    const assetsElement = await page.$('#total_assets')
    const assetsCount = await (await assetsElement.getProperty('innerText')).jsonValue()
    expect(assetsCount, 'Total assets in TESTNET should be 6').contain('6 Assets')

    // Assets BTC receive
    await page.waitForSelector('#assert_list_item', {
      visible: true
    })

    const assertListItemCount = await page.$$('#assert_list_item')
    await assertListItemCount[0].click() // BTC click
    await page.waitForSelector('#receive', {
      visible: true
    })
    console.log('BTC Receive option has been displayed')
    await page.click('#receive')
    await page.waitForSelector('.receive_address', {
      visible: true
    })

    await page.waitForSelector('.receive_address:not(:empty)')

    // QR code has been loaded
    await page.waitForSelector('.receive_qr', {
      visible: true,
      timeout: 3000
    })

    // BTC receive address validation
    const addressText = await page.$eval('#receive_address', (el) => el.textContent.trim())
    expect(addressText, 'BTC address must be string and not undefined')
      .to.be.a('string')
    assert.isNotNull(addressText, 'BTC address not null')

    // Check Copy address button
    await page.click('#copy_address_button')
    // Done
    await page.click('#done_button')
    await page.waitForSelector('#receive')

    // Lock
    await page.click('#burger_icon_menu')
    await page.waitForSelector('#lock', {
      visible: true
    })

    await page.click('#lock')
    await page.waitForSelector('#password', {
      visible: true
    })

    // unlock
    await page.type('#password', password)
    await page.click('#unlock_button')
    // overview page after unlock
    await page.waitForSelector('#overview', {
      visible: true
    })
    console.log('User successfully loggedIn after unlock')
  })

  it('import wallet use seed phrase 12 word with 0 coins', async () => {
    await page.click('#terms_privacy_accept_button') // Accept terms
    const importWithSeedOptionElement = await page.waitForSelector('#import_with_seed_phrase_option', {
      visible: true
    })
    await importWithSeedOptionElement.click()
    console.log('Import with seed phrase option has been displayed')
    await page.waitForSelector('#import-wallet_top', {
      visible: true
    })
    console.log('Import wallet page hase been loaded')
    // check continue button has been disabled
    let enterWords = 'blouse sort ice forward ivory enrich connect mimic apple setup level palm';
    let enterWord = enterWords.split(' ');
    const seedsWordsCount = await page.$$('#import_wallet_word')
    for (let i = 0; i < seedsWordsCount.length; i++) {
      const wordInput = seedsWordsCount[i]
      await wordInput.type(enterWord[i])
    }

    // Click on continue button
    await page.click('#import_wallet_continue_button')
    console.log('Import wallet continue button has been clicked')

    // Create a password
    await page.type('#password', password)
    await page.type('#confirmPassword', password)
    await page.click('#next_button') // click on continue

    // overview page
    await page.waitForSelector('#overview', {
      visible: true
    })

    await page.click('#head_network')
    await page.waitForSelector('#testnet_network', {
      visible: true
    })
    console.log('user successfully logged in after import wallet')

    await page.click('#testnet_network')
    const overviewText = await page.$eval('.text-muted', el => el.innerText)
    expect(overviewText, 'Testnet overview header').contain('TESTNET')
    console.log(chalk.green('user successfully changed to TESTNET'))
    // check Send & Swap & Receive options have been displayed
    await page.waitForSelector('#send_action', {
      visible: true
    })
    await page.waitForSelector('#swap_action', {
      visible: true
    })
    await page.waitForSelector('#receive_action', {
      visible: true
    })
  })
  it('import wallet and see balance', async () => {
    await page.click('#terms_privacy_accept_button') // Accept terms
    const importWithSeedOptionElement = await page.waitForSelector('#import_with_seed_phrase_option', {
      visible: true
    })
    await importWithSeedOptionElement.click()
    console.log('Import with seed phrase option has been displayed')
    await page.waitForSelector('#import-wallet_top', {
      visible: true
    })
    console.log('Import wallet page hase been loaded')
    // Get the existing SEED words as environment variables
    let words
    const SEED_WORDS = process.env.SEED_WORDS
    if (!SEED_WORDS) {
      throw new Error('Please provide SEED_WORDS as environment variables')
    } else {
      words = SEED_WORDS.split(' ')
    }

    const seedsWordsCount = await page.$$('#import_wallet_word')
    for (let i = 0; i < seedsWordsCount.length; i++) {
      const wordInput = seedsWordsCount[i]
      await wordInput.type(words[i])
    }

    // Click on continue button
    await page.click('#import_wallet_continue_button')
    console.log('Import wallet continue button has been clicked')

    // Create a password
    await page.type('#password', password)
    await page.type('#confirmPassword', password)
    await page.click('#next_button') // click on continue

    // overview page
    await page.waitForSelector('#overview', {
      visible: true
    })

    await page.click('#head_network')
    await page.waitForSelector('#testnet_network', {
      visible: true
    })
    console.log('user successfully logged in after import wallet')

    await page.click('#testnet_network')
    const overviewText = await page.$eval('.text-muted', el => el.innerText)
    expect(overviewText, 'Testnet overview header').contain('TESTNET')
    console.log('user successfully changed to TESTNET')
    // check Send & Swap & Receive options have been displayed
    await page.waitForSelector('#send_action', {
      visible: true
    })
    await page.waitForSelector('#swap_action', {
      visible: true
    })
    await page.waitForSelector('#receive_action', {
      visible: true
    })

    // validate the testnet asserts count
    const assetsCount = await page.$eval('#total_assets', el => el.innerText)
    expect(assetsCount, 'Total assets in TESTNET should be 6').contain('6 Assets')

    // Check the currency
    const walletStatText = await page.$eval('.wallet-stats', el => el.innerText)
    expect(walletStatText, 'Wallet stats has currency should be USD').contain('USD')
    // Check the Total amount - 10s wait to load amount
    await page.waitForTimeout(10000);
    const totalAmount = await page.$eval('.wallet-stats_total', el => (el.innerText).replace(/[.,\s]/g, ''))
    expect(parseInt(totalAmount), 'Funds in my wallet should be greater than 2000 USD').greaterThanOrEqual(2000)
    console.log(chalk.green('After Import wallet, the funds total greater than 2000 USD'))
  })

  it('SWAP BTC to RBTC', async () => {
    await page.click('#terms_privacy_accept_button') // Accept terms
    const importWithSeedOptionElement = await page.waitForSelector('#import_with_seed_phrase_option', {
      visible: true
    })
    await importWithSeedOptionElement.click()
    console.log('Import with seed phrase option has been displayed')
    await page.waitForSelector('#import-wallet_top', {
      visible: true
    })
    console.log('Import wallet page hase been loaded')
    // Get the existing SEED words as environment variables
    let words
    const SEED_WORDS = process.env.SEED_WORDS
    if (!SEED_WORDS) {
      throw new Error('Please provide SEED_WORDS as environment variables')
    } else {
      words = SEED_WORDS.split(' ')
    }

    const seedsWordsCount = await page.$$('#import_wallet_word')
    for (let i = 0; i < seedsWordsCount.length; i++) {
      const wordInput = seedsWordsCount[i]
      await wordInput.type(words[i])
    }

    // Click on continue button
    await page.click('#import_wallet_continue_button')
    console.log('Import wallet continue button has been clicked')

    // Create a password
    await page.type('#password', password)
    await page.type('#confirmPassword', password)
    await page.click('#next_button') // click on continue

    // overview page
    await page.waitForSelector('#overview', {
      visible: true
    })

    await page.click('#head_network')
    await page.waitForSelector('#testnet_network', {
      visible: true
    })
    console.log('user successfully logged in after import wallet')

    await page.click('#testnet_network')
    const overviewText = await page.$eval('.text-muted', el => el.innerText)
    expect(overviewText, 'Testnet overview header').contain('TESTNET')
    console.log('user successfully changed to TESTNET')
    // check Send & Swap & Receive options have been displayed
    await page.waitForSelector('#send_action', {
      visible: true
    })
    await page.waitForSelector('#swap_action', {
      visible: true
    })
    await page.waitForSelector('#receive_action', {
      visible: true
    })

    // validate the testnet asserts count
    const assetsCount = await page.$eval('#total_assets', el => el.innerText)
    expect(assetsCount, 'Total assets in TESTNET should be 6').contain('6 Assets')

    // Check the currency
    const walletStatText = await page.$eval('.wallet-stats', el => el.innerText)
    expect(walletStatText, 'Wallet stats has currency should be USD').contain('USD')
    // Check the Total amount
    await page.waitForTimeout(5000)
    // const totalAmount = await page.$eval('.wallet-stats_total', el => el.innerText)
    // expect(parseInt(totalAmount), 'Funds in my wallet should be greater than 2000 USD').greaterThanOrEqual(2000)

    // Click on SWAP
    await page.click('#swap_action')
    await page.waitForSelector('#search_for_a_currency_search', {
      visible: true
    })
    // SEND from assert (BTC)
    await page.type('#search_for_a_currency_search', 'BTC')
    await page.waitForTimeout(2000)
    const assertListItems = await page.$$('#assert_list_item')
    await assertListItems[0].click()
    // select min
    const minAmountElement = await page.waitForSelector('#min_amount_send_button', {
      visible: true,
      timeout: 10000
    })

    await minAmountElement.click()

    // Receive to assert(RBTC)
    await page.click('.swap-receive-main-icon', { slowMo: 20 })
    await page.waitForSelector('#search_for_a_currency', {
      visible: true
    })
    await page.type('#search_for_a_currency', 'RBTC')
    const assertListItemsNew = await page.$$('#assert_list_item')
    await assertListItemsNew[0].click()
    await assertListItemsNew[1].click()

    // RATE
    // const rate = await page.$eval('#rate_block', el => el.innerText)
    // expect(rate.trim()).contain('1BTC=1RBTC')

    // Click on Network speed + FEE
    await page.click('#network_speed_fee')

    // Review
    await page.click('#swap_review_button')
    console.log(chalk.green('User clicked on Swap review button'))

    await page.waitForSelector('#initiate_swap_button', {
      visible: true
    })
    console.log(chalk.green('Initiate swap button has been enabled, almost there...'))
    // TODO: Click on swap confirm step
  })
})
