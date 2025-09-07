"use client"

import { useState, useEffect } from "react"
import { SellerLevelManager, type LevelRequirements } from "@/lib/seller-levels"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function SellerLevelAdmin() {
  const [levelRequirements, setLevelRequirements] = useState<LevelRequirements[]>([])
  const [editingLevel, setEditingLevel] = useState<LevelRequirements | null>(null)
  const [manualOverrideUserId, setManualOverrideUserId] = useState("")
  const [manualOverrideLevel, setManualOverrideLevel] = useState("")

  useEffect(() => {
    loadLevelRequirements()
  }, [])

  const loadLevelRequirements = () => {
    const requirements = SellerLevelManager.getLevelRequirements()
    setLevelRequirements(requirements)
  }

  const saveLevelRequirements = () => {
    SellerLevelManager.updateLevelRequirements(levelRequirements)
    alert("Level requirements updated successfully!")
  }

  const resetToDefaults = () => {
    if (confirm("Are you sure you want to reset all level requirements to defaults?")) {
      SellerLevelManager.resetToDefaults()
      loadLevelRequirements()
      alert("Level requirements reset to defaults!")
    }
  }

  const updateLevelRequirement = (levelId: string, field: string, value: any) => {
    setLevelRequirements((prev) =>
      prev.map((level) => {
        if (level.id === levelId) {
          if (field.startsWith("requirements.")) {
            const reqField = field.replace("requirements.", "")
            return {
              ...level,
              requirements: {
                ...level.requirements,
                [reqField]: value === "" ? undefined : Number(value),
              },
            }
          } else if (field === "benefits") {
            return {
              ...level,
              benefits: value.split("\n").filter((b: string) => b.trim()),
            }
          } else {
            return {
              ...level,
              [field]: field === "maxGigs" ? Number(value) : value,
            }
          }
        }
        return level
      }),
    )
  }

  const applyManualOverride = () => {
    if (!manualOverrideUserId || !manualOverrideLevel) {
      alert("Please enter both User ID and Level")
      return
    }

    SellerLevelManager.setManualOverride(manualOverrideUserId, manualOverrideLevel)
    alert(`Manual override applied: User ${manualOverrideUserId} set to ${manualOverrideLevel}`)
    setManualOverrideUserId("")
    setManualOverrideLevel("")
  }

  const removeManualOverride = () => {
    if (!manualOverrideUserId) {
      alert("Please enter User ID")
      return
    }

    SellerLevelManager.removeManualOverride(manualOverrideUserId)
    alert(`Manual override removed for user ${manualOverrideUserId}`)
    setManualOverrideUserId("")
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Seller Level Administration</h2>
        <div className="space-x-2">
          <Button onClick={saveLevelRequirements}>Save Changes</Button>
          <Button onClick={resetToDefaults} variant="outline">
            Reset to Defaults
          </Button>
        </div>
      </div>

      <Tabs defaultValue="requirements" className="space-y-4">
        <TabsList>
          <TabsTrigger value="requirements">Level Requirements</TabsTrigger>
          <TabsTrigger value="overrides">Manual Overrides</TabsTrigger>
        </TabsList>

        <TabsContent value="requirements" className="space-y-4">
          {levelRequirements.map((level) => (
            <Card key={level.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Badge className={`bg-${level.color}-100 text-${level.color}-800`}>
                    {level.badge} {level.displayName}
                  </Badge>
                  <span className="text-sm text-gray-500">Max {level.maxGigs} gigs</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Display Name</Label>
                    <Input
                      value={level.displayName}
                      onChange={(e) => updateLevelRequirement(level.id, "displayName", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Max Gigs</Label>
                    <Input
                      type="number"
                      value={level.maxGigs}
                      onChange={(e) => updateLevelRequirement(level.id, "maxGigs", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Min Orders</Label>
                    <Input
                      type="number"
                      value={level.requirements.minOrders || ""}
                      onChange={(e) => updateLevelRequirement(level.id, "requirements.minOrders", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Min Earnings ($)</Label>
                    <Input
                      type="number"
                      value={level.requirements.minEarnings || ""}
                      onChange={(e) => updateLevelRequirement(level.id, "requirements.minEarnings", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Min Rating</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      value={level.requirements.minRating || ""}
                      onChange={(e) => updateLevelRequirement(level.id, "requirements.minRating", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Min On-Time Delivery (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={level.requirements.minOnTimeDelivery || ""}
                      onChange={(e) =>
                        updateLevelRequirement(level.id, "requirements.minOnTimeDelivery", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label>Min Response Rate (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={level.requirements.minResponseRate || ""}
                      onChange={(e) => updateLevelRequirement(level.id, "requirements.minResponseRate", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Min Account Age (days)</Label>
                    <Input
                      type="number"
                      value={level.requirements.minAccountAge || ""}
                      onChange={(e) => updateLevelRequirement(level.id, "requirements.minAccountAge", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Evaluation Period (days)</Label>
                    <Input
                      type="number"
                      value={level.requirements.evaluationPeriod || ""}
                      onChange={(e) =>
                        updateLevelRequirement(level.id, "requirements.evaluationPeriod", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label>Max Policy Violations</Label>
                    <Input
                      type="number"
                      min="0"
                      value={level.requirements.maxPolicyViolations ?? ""}
                      onChange={(e) =>
                        updateLevelRequirement(level.id, "requirements.maxPolicyViolations", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label>Benefits (one per line)</Label>
                  <Textarea
                    value={level.benefits.join("\n")}
                    onChange={(e) => updateLevelRequirement(level.id, "benefits", e.target.value)}
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="overrides" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manual Level Override</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>User ID</Label>
                  <Input
                    value={manualOverrideUserId}
                    onChange={(e) => setManualOverrideUserId(e.target.value)}
                    placeholder="Enter user ID"
                  />
                </div>
                <div>
                  <Label>Level</Label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={manualOverrideLevel}
                    onChange={(e) => setManualOverrideLevel(e.target.value)}
                  >
                    <option value="">Select level</option>
                    {levelRequirements.map((level) => (
                      <option key={level.id} value={level.id}>
                        {level.displayName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={applyManualOverride}>Apply Override</Button>
                <Button onClick={removeManualOverride} variant="outline">
                  Remove Override
                </Button>
              </div>
              <p className="text-sm text-gray-600">
                Manual overrides bypass all requirements and immediately set a seller to the specified level. Use this
                feature carefully as it overrides the automatic level calculation.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
