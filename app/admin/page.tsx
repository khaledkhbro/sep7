"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, DollarSign, Briefcase, ShoppingBag } from "lucide-react"

export default function AdminPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">Platform overview and key metrics</p>
      </div>

      <div className="space-y-6">
        {/* Simple Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,234</div>
              <p className="text-xs text-muted-foreground">+20.1% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$45,231</div>
              <p className="text-xs text-muted-foreground">+15.3% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">573</div>
              <p className="text-xs text-muted-foreground">+12.5% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Services</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">89</div>
              <p className="text-xs text-muted-foreground">+8.2% from last month</p>
            </CardContent>
          </Card>
        </div>

        {/* Simple Content Cards */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">New user registration</p>
                    <p className="text-sm text-muted-foreground">John Doe joined the platform</p>
                  </div>
                  <div className="text-sm text-muted-foreground">2 hours ago</div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Job completed</p>
                    <p className="text-sm text-muted-foreground">React Developer project finished</p>
                  </div>
                  <div className="text-sm text-muted-foreground">4 hours ago</div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Payment processed</p>
                    <p className="text-sm text-muted-foreground">$250 payment completed</p>
                  </div>
                  <div className="text-sm text-muted-foreground">6 hours ago</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Server Status</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600">Online</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Database</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600">Connected</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Payment Gateway</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm text-yellow-600">Maintenance</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Email Service</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600">Active</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button className="p-4 text-center border rounded-lg hover:bg-gray-50 transition-colors">
                <Users className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                <div className="text-sm font-medium">Manage Users</div>
              </button>
              <button className="p-4 text-center border rounded-lg hover:bg-gray-50 transition-colors">
                <Briefcase className="h-6 w-6 mx-auto mb-2 text-green-600" />
                <div className="text-sm font-medium">View Jobs</div>
              </button>
              <button className="p-4 text-center border rounded-lg hover:bg-gray-50 transition-colors">
                <DollarSign className="h-6 w-6 mx-auto mb-2 text-yellow-600" />
                <div className="text-sm font-medium">Transactions</div>
              </button>
              <button className="p-4 text-center border rounded-lg hover:bg-gray-50 transition-colors">
                <ShoppingBag className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                <div className="text-sm font-medium">Services</div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
