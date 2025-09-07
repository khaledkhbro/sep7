"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { X, Search, Eye } from "lucide-react"
import { type WorkProof, getWorkProofStatusColor, getWorkProofStatusLabel } from "@/lib/work-proofs"
import { EnhancedWorkProofModal } from "./enhanced-work-proof-modal"

interface WorkProofModalProps {
  proofs: WorkProof[]
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
  userRole: "employer" | "worker"
}

interface ProofDetailModalProps {
  proof: WorkProof | null
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
  userRole: "employer" | "worker"
}

function ProofDetailModal({ proof, isOpen, onClose, onUpdate, userRole }: ProofDetailModalProps) {
  return (
    <EnhancedWorkProofModal proof={proof} isOpen={isOpen} onClose={onClose} onUpdate={onUpdate} userRole={userRole} />
  )
}

function WorkProofModal({ proofs, isOpen, onClose, onUpdate, userRole }: WorkProofModalProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [entriesPerPage, setEntriesPerPage] = useState(10)
  const [selectedProof, setSelectedProof] = useState<WorkProof | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)

  const filteredProofs = proofs.filter(
    (proof) =>
      proof.worker.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proof.worker.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proof.worker.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proof.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleViewProof = (proof: WorkProof) => {
    setSelectedProof(proof)
    setDetailModalOpen(true)
  }

  const handleDetailModalClose = () => {
    setDetailModalOpen(false)
    setSelectedProof(null)
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 -m-6 mb-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-semibold">Work Proof</DialogTitle>
              <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/20">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col p-6 -mx-6">
            {/* Controls */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Show</span>
                  <select
                    value={entriesPerPage}
                    onChange={(e) => setEntriesPerPage(Number(e.target.value))}
                    className="border rounded px-2 py-1 text-sm"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                  <span className="text-sm text-gray-600">Entries</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Search:</span>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search proofs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 w-64"
                  />
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow className="bg-purple-600 hover:bg-purple-600">
                    <TableHead className="text-white font-semibold">Proof ID</TableHead>
                    <TableHead className="text-white font-semibold">User ID</TableHead>
                    <TableHead className="text-white font-semibold">User Details</TableHead>
                    <TableHead className="text-white font-semibold">Work Proof</TableHead>
                    <TableHead className="text-white font-semibold text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProofs.slice(0, entriesPerPage).map((proof, index) => (
                    <TableRow key={proof.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="bg-purple-600 text-white px-3 py-2 rounded text-center font-medium">
                          proof{1591 + index}
                          <br />
                          <span className="text-xs">{19 + index}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{proof.workerId}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {proof.worker.firstName[0]}
                              {proof.worker.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-sm">
                              {proof.worker.firstName} {proof.worker.lastName}
                            </div>
                            <div className="text-xs text-gray-500">@{proof.worker.username}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <div className="text-sm font-medium text-gray-900 truncate">{proof.title}</div>
                          <div className="text-xs text-gray-500 mt-1 truncate">{proof.description}</div>
                          <Badge className={`mt-1 ${getWorkProofStatusColor(proof.status)}`}>
                            {getWorkProofStatusLabel(proof.status)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewProof(proof)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Eye className="mr-1 h-3 w-3" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredProofs.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-600">No work proofs found</p>
                <p className="text-sm text-gray-500 mt-2">
                  {searchTerm ? "Try adjusting your search terms" : "Work proofs will appear here once submitted"}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <ProofDetailModal
        proof={selectedProof}
        isOpen={detailModalOpen}
        onClose={handleDetailModalClose}
        onUpdate={onUpdate}
        userRole={userRole}
      />
    </>
  )
}

export { WorkProofModal }
export default WorkProofModal
