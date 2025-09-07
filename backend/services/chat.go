package services

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/google/uuid"
	"microjob-backend/models"
)

type ChatService struct {
	db            *sql.DB
	walletService *WalletService
	adminService  *AdminService
}

func NewChatService(db *sql.DB, walletService *WalletService, adminService *AdminService) *ChatService {
	return &ChatService{
		db:            db,
		walletService: walletService,
		adminService:  adminService,
	}
}

func (cs *ChatService) ProcessMoneyTransfer(senderID, receiverID, chatID string, amount float64, message string) (*models.ChatMoneyTransfer, error) {
	// Get commission settings
	feeSettings, err := cs.adminService.GetAllFeeSettings()
	if err != nil {
		return nil, err
	}

	var commissionAmount float64 = 0
	for _, setting := range feeSettings {
		if setting.FeeType == "chat_transfer" && setting.IsActive {
			commissionAmount = (amount * setting.FeePercentage) / 100
			commissionAmount += setting.FeeFixed

			if commissionAmount < setting.MinimumFee {
				commissionAmount = setting.MinimumFee
			}

			if setting.MaximumFee != nil && commissionAmount > *setting.MaximumFee {
				commissionAmount = *setting.MaximumFee
			}
			break
		}
	}

	netAmount := amount - commissionAmount

	// Start database transaction
	tx, err := cs.db.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	// Create transfer record
	transfer := &models.ChatMoneyTransfer{
		ID:               uuid.New().String(),
		ChatID:           chatID,
		SenderID:         senderID,
		ReceiverID:       receiverID,
		Amount:           amount,
		CommissionAmount: commissionAmount,
		NetAmount:        netAmount,
		Message:          message,
		Status:           "pending",
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}

	insertQuery := `
		INSERT INTO chat_money_transfers (id, chat_id, sender_id, receiver_id, amount, 
			commission_amount, net_amount, message, status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`

	_, err = tx.Exec(insertQuery, transfer.ID, transfer.ChatID, transfer.SenderID, transfer.ReceiverID,
		transfer.Amount, transfer.CommissionAmount, transfer.NetAmount, transfer.Message,
		transfer.Status, transfer.CreatedAt, transfer.UpdatedAt)
	if err != nil {
		return nil, err
	}

	// Check sender balance
	var senderBalance float64
	err = tx.QueryRow("SELECT balance FROM wallets WHERE user_id = $1", senderID).Scan(&senderBalance)
	if err != nil {
		return nil, fmt.Errorf("failed to get sender balance: %w", err)
	}

	if senderBalance < amount {
		return nil, fmt.Errorf("insufficient balance")
	}

	// Process wallet transactions
	// Deduct from sender
	_, err = tx.Exec(`
		UPDATE wallets 
		SET balance = balance - $1, total_spent = total_spent + $1, updated_at = $2 
		WHERE user_id = $3`, amount, time.Now(), senderID)
	if err != nil {
		return nil, err
	}

	// Add to receiver
	_, err = tx.Exec(`
		UPDATE wallets 
		SET balance = balance + $1, total_earned = total_earned + $1, updated_at = $2 
		WHERE user_id = $3`, netAmount, time.Now(), receiverID)
	if err != nil {
		return nil, err
	}

	// Create wallet transaction records
	senderTransaction := &models.WalletTransaction{
		ID:            uuid.New().String(),
		UserID:        senderID,
		Type:          "chat_transfer_sent",
		Amount:        amount,
		Description:   fmt.Sprintf("Money transfer to user: %s", message),
		ReferenceID:   &transfer.ID,
		ReferenceType: stringPtr("chat_transfer"),
		BalanceType:   "deposit",
		Status:        "completed",
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	receiverTransaction := &models.WalletTransaction{
		ID:            uuid.New().String(),
		UserID:        receiverID,
		Type:          "chat_transfer_received",
		Amount:        netAmount,
		Description:   fmt.Sprintf("Money received from user: %s", message),
		ReferenceID:   &transfer.ID,
		ReferenceType: stringPtr("chat_transfer"),
		BalanceType:   "deposit",
		Status:        "completed",
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	// Insert transaction records
	transactionQuery := `
		INSERT INTO wallet_transactions (id, user_id, type, amount, description, reference_id, 
			reference_type, balance_type, status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`

	_, err = tx.Exec(transactionQuery, senderTransaction.ID, senderTransaction.UserID, senderTransaction.Type,
		senderTransaction.Amount, senderTransaction.Description, senderTransaction.ReferenceID,
		senderTransaction.ReferenceType, senderTransaction.BalanceType, senderTransaction.Status,
		senderTransaction.CreatedAt, senderTransaction.UpdatedAt)
	if err != nil {
		return nil, err
	}

	_, err = tx.Exec(transactionQuery, receiverTransaction.ID, receiverTransaction.UserID, receiverTransaction.Type,
		receiverTransaction.Amount, receiverTransaction.Description, receiverTransaction.ReferenceID,
		receiverTransaction.ReferenceType, receiverTransaction.BalanceType, receiverTransaction.Status,
		receiverTransaction.CreatedAt, receiverTransaction.UpdatedAt)
	if err != nil {
		return nil, err
	}

	// Update transfer status to completed
	_, err = tx.Exec(`
		UPDATE chat_money_transfers 
		SET status = 'completed', completed_at = $1, updated_at = $1 
		WHERE id = $2`, time.Now(), transfer.ID)
	if err != nil {
		return nil, err
	}

	// Commit transaction
	err = tx.Commit()
	if err != nil {
		return nil, err
	}

	transfer.Status = "completed"
	completedAt := time.Now()
	transfer.CompletedAt = &completedAt

	return transfer, nil
}

func stringPtr(s string) *string {
	return &s
}
