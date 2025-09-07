"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TransactionItem } from "@/components/wallet/transaction-item"
import { DepositDialog } from "@/components/wallet/deposit-dialog"
import { WithdrawalDialog } from "@/components/wallet/withdrawal-dialog"
import { WalletBalance } from "@/components/ui/price-display"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import {
  getWallet,
  getTransactions,
  getPaymentMethods,
  getUpcomingPayments,
  getPendingPayments,
  addWalletTransaction,
  type Wallet,
  type WalletTransaction,
  type PaymentMethod,
  type PaymentSchedule,
} from "@/lib/wallet"
import {
  getUserCoinData,
  getCoinSystemSettings,
  cashoutCoins,
  type UserCoinData,
  type CoinSystemSettings,
} from "@/lib/coin-system"
import {
  WalletIcon,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Banknote,
  Calendar,
  AlertCircle,
  Coins,
  Sparkles,
} from "lucide-react"

export default function WalletPage() {
  const { user } = useAuth()
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [transactions, setTransactions] = useState<WalletTransaction[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [upcomingPayments, setUpcomingPayments] = useState<PaymentSchedule[]>([])
  const [pendingPayments, setPendingPayments] = useState<WalletTransaction[]>([])
  const [coinData, setCoinData] = useState<UserCoinData | null>(null)
  const [coinSettings, setCoinSettings] = useState<CoinSystemSettings | null>(null)
  const [cashingOutCoins, setCashingOutCoins] = useState(false)
  const [loading, setLoading] = useState(true)
  const [transactionFilter, setTransactionFilter] = useState<string>("all")

  useEffect(() => {
    if (user?.id) {
      loadWalletData()
    }
  }, [user?.id])

  const loadWalletData = async () => {
    if (!user?.id) {
      console.log("[v0] No user ID available for wallet loading")
      setLoading(false)
      return
    }

    console.log("[v0] Loading wallet data for user:", user.id)
    setLoading(true)
    try {
      const [
        walletData,
        transactionsData,
        paymentMethodsData,
        upcomingData,
        pendingData,
        coinUserData,
        coinSystemSettings,
      ] = await Promise.all([
        getWallet(user.id),
        getTransactions(`wallet_${user.id}`),
        getPaymentMethods(user.id),
        getUpcomingPayments(user.id),
        getPendingPayments(user.id),
        getUserCoinData(user.id),
        getCoinSystemSettings(),
      ])

      console.log("[v0] Loaded wallet data:", walletData)
      setWallet(walletData)
      setTransactions(transactionsData)
      setPaymentMethods(paymentMethodsData)
      setUpcomingPayments(upcomingData)
      setPendingPayments(pendingData)
      setCoinData(coinUserData)
      setCoinSettings(coinSystemSettings)
    } catch (error) {
      console.error("[v0] Failed to load wallet data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCoinCashout = async () => {
    if (!user?.id || !coinData || !coinSettings) return

    if (coinData.availableCoins < coinSettings.minCashoutCoins) {
      toast.error(`Minimum cashout is ${coinSettings.minCashoutCoins} coins`)
      return
    }

    setCashingOutCoins(true)
    try {
      const cashout = await cashoutCoins(user.id, coinData.availableCoins)

      // Add to wallet as earnings
      await addWalletTransaction({
        userId: user.id,
        type: "earning",
        amount: cashout.netAmount,
        description: `Coin cashout: ${cashout.coinsAmount} coins`,
        referenceId: cashout.id,
        referenceType: "coin_cashout",
      })

      toast.success(`Successfully cashed out ${cashout.coinsAmount} coins for $${cashout.netAmount.toFixed(2)}!`)
      loadWalletData()
    } catch (error) {
      console.error("Failed to cashout coins:", error)
      toast.error("Failed to cashout coins")
    } finally {
      setCashingOutCoins(false)
    }
  }

  const filteredTransactions = transactions.filter((transaction) => {
    if (transactionFilter === "all") return true
    if (transactionFilter === "chat") return transaction.referenceType === "chat_transfer"
    return transaction.type === transactionFilter
  })

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!wallet) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">Failed to load wallet data</p>
      </div>
    )
  }

  return (
    <>
      <DashboardHeader title="Wallet" description="Manage your funds, view transactions, and handle payments" />

      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-6">
          {/* Balance Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-700 font-medium">Deposit Balance</p>
                    <p className="text-xl text-blue-800">
                      <WalletBalance amount={wallet.depositBalance || 0} />
                    </p>
                    <p className="text-xs text-blue-600 mt-1">Cannot withdraw</p>
                  </div>
                  <Banknote className="h-6 w-6 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-700 font-medium">Earnings Balance</p>
                    <p className="text-xl text-green-800">
                      <WalletBalance amount={wallet.earningsBalance || 0} />
                    </p>
                    <p className="text-xs text-green-600 mt-1">Available to withdraw</p>
                  </div>
                  <WalletIcon className="h-6 w-6 text-green-600" />
                </div>
              </CardContent>
            </Card>

            {coinSettings?.isEnabled && coinData && (
              <Card className="bg-gradient-to-br from-yellow-50 to-orange-100 border-yellow-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-yellow-700 font-medium">Coin Balance</p>
                      <p className="text-xl text-yellow-800">{coinData.availableCoins.toLocaleString()}</p>
                      <p className="text-xs text-yellow-600 mt-1">
                        ${(coinData.availableCoins * coinSettings.coinToUsdRate).toFixed(4)} USD
                      </p>
                    </div>
                    <Coins className="h-6 w-6 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Earned</p>
                    <p className="text-xl font-bold text-blue-600">
                      <WalletBalance amount={wallet.totalEarned || 0} />
                    </p>
                  </div>
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Spent</p>
                    <p className="text-xl font-bold text-red-600">
                      <WalletBalance amount={wallet.totalSpent || 0} />
                    </p>
                  </div>
                  <TrendingDown className="h-6 w-6 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Upcoming Payments</p>
                    <p className="text-xl font-bold text-purple-600">
                      <WalletBalance amount={wallet.upcomingPayments || 0} />
                    </p>
                  </div>
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pending Payments</p>
                    <p className="text-xl font-bold text-orange-600">
                      <WalletBalance amount={wallet.pendingPayments || 0} />
                    </p>
                  </div>
                  <AlertCircle className="h-6 w-6 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {coinSettings?.isEnabled && coinData && coinData.availableCoins >= coinSettings.minCashoutCoins && (
            <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                      <Sparkles className="h-5 w-5" />
                      Coin Cashout Available
                    </h3>
                    <p className="text-yellow-600 text-sm mb-1">
                      You have {coinData.availableCoins.toLocaleString()} coins ready to cash out
                    </p>
                    <p className="text-yellow-500 text-xs">
                      Cash out value: ${(coinData.availableCoins * coinSettings.coinToUsdRate).toFixed(2)}
                      {coinSettings.cashoutFeePercentage > 0 && (
                        <span className="text-orange-600">
                          {" "}
                          ($
                          {(
                            coinData.availableCoins *
                            coinSettings.coinToUsdRate *
                            (1 - coinSettings.cashoutFeePercentage / 100)
                          ).toFixed(2)}{" "}
                          after {coinSettings.cashoutFeePercentage}% fee)
                        </span>
                      )}
                    </p>
                  </div>
                  <Button
                    onClick={handleCoinCashout}
                    disabled={cashingOutCoins}
                    className="bg-yellow-600 hover:bg-yellow-700"
                  >
                    {cashingOutCoins ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <Coins className="mr-2 h-4 w-4" />
                        Cash Out Coins
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {(upcomingPayments.length > 0 || pendingPayments.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {upcomingPayments.length > 0 && (
                <Card className="border-purple-200 bg-purple-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-purple-800 flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Upcoming Payments ({upcomingPayments.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {upcomingPayments.slice(0, 3).map((payment) => (
                      <div key={payment.id} className="flex justify-between items-center text-sm">
                        <span className="text-purple-700">{payment.description}</span>
                        <div className="text-right">
                          <div className="font-semibold text-purple-800">
                            <WalletBalance amount={payment.amount} />
                          </div>
                          <div className="text-purple-600">{new Date(payment.scheduledDate).toLocaleDateString()}</div>
                        </div>
                      </div>
                    ))}
                    {upcomingPayments.length > 3 && (
                      <p className="text-purple-600 text-xs">+{upcomingPayments.length - 3} more payments</p>
                    )}
                  </CardContent>
                </Card>
              )}

              {pendingPayments.length > 0 && (
                <Card className="border-orange-200 bg-orange-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-orange-800 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      Pending Payments ({pendingPayments.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {pendingPayments.slice(0, 3).map((payment) => (
                      <div key={payment.id} className="flex justify-between items-center text-sm">
                        <span className="text-orange-700">{payment.description}</span>
                        <div className="text-right">
                          <div className="font-semibold text-orange-800">
                            <WalletBalance amount={Math.abs(payment.amount)} />
                          </div>
                          <div className="text-orange-600">{new Date(payment.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                    ))}
                    {pendingPayments.length > 3 && (
                      <p className="text-orange-600 text-xs">+{pendingPayments.length - 3} more payments</p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <DepositDialog paymentMethods={paymentMethods} onSuccess={loadWalletData} />
                <WithdrawalDialog wallet={wallet} paymentMethods={paymentMethods} onSuccess={loadWalletData} />
                {coinSettings?.isEnabled && (
                  <Button
                    variant="outline"
                    className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100"
                    asChild
                  >
                    <a href="/dashboard/coins">
                      <Coins className="mr-2 h-4 w-4" />
                      Collect Daily Coins
                    </a>
                  </Button>
                )}
                <Button variant="outline" className="bg-transparent">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Payment Methods
                </Button>
                <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-md">
                  <AlertCircle className="h-4 w-4" />
                  <span>Only earnings balance can be withdrawn</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transaction History */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={transactionFilter} onValueChange={setTransactionFilter} className="space-y-4">
                <TabsList>
                  <TabsTrigger value="all">All Transactions</TabsTrigger>
                  <TabsTrigger value="earning">Earnings</TabsTrigger>
                  <TabsTrigger value="payment">Payments</TabsTrigger>
                  <TabsTrigger value="deposit">Deposits</TabsTrigger>
                  <TabsTrigger value="withdrawal">Withdrawals</TabsTrigger>
                  <TabsTrigger value="chat">Chat</TabsTrigger>
                </TabsList>

                <TabsContent value={transactionFilter} className="space-y-4">
                  {filteredTransactions.length > 0 ? (
                    <div className="space-y-3">
                      {filteredTransactions.map((transaction) => (
                        <TransactionItem key={transaction.id} transaction={transaction} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <DollarSign className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
                      <p className="text-gray-600">
                        {transactionFilter === "all"
                          ? "You haven't made any transactions yet."
                          : transactionFilter === "chat"
                            ? "No chat transfers found."
                            : `No ${transactionFilter} transactions found.`}
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
