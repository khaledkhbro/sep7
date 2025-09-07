package services

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/google/uuid"
	"microjob-backend/database"
	"microjob-backend/models"
)

type WalletService struct {
	db *sql.DB
}

func NewWalletService(db *sql.DB) *WalletService {
	return &WalletService{db: db}
}

func (ws *WalletService) GetWalletByUserID(userID string) (*models.Wallet, error) {
	query := `
		SELECT id, user_id, balance, pending_balance, total_earned, total_spent, 
			   created_at, updated_at 
		FROM wallets 
		WHERE user_id = $1`
	
	var wallet models.Wallet
	err := ws.db.QueryRow(query, userID).Scan(
		&wallet.ID, &wallet.UserID, &wallet.Balance, &wallet.PendingBalance,
		&wallet.TotalEarned, &wallet.TotalSpent, &wallet.CreatedAt, &wallet.UpdatedAt,
	)
	
	if err == sql.ErrNoRows {
		// Create wallet if it doesn't exist
		return ws.CreateWallet(userID)
	}
	
	return &wallet, err
}

func (ws *WalletService) CreateWallet(userID string) (*models.Wallet, error) {
	wallet := &models.Wallet{
		ID:             uuid.New().String(),
		UserID:         userID,
		Balance:        0,
		PendingBalance: 0,
		TotalEarned:    0,
		TotalSpent:     0,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}
	
	query := `
		INSERT INTO wallets (id, user_id, balance, pending_balance, total_earned, total_spent, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`
	
	_, err := ws.db.Exec(query, wallet.ID, wallet.UserID, wallet.Balance, wallet.PendingBalance,
		wallet.TotalEarned, wallet.TotalSpent, wallet.CreatedAt, wallet.UpdatedAt)
	
	return wallet, err
}

func (ws *WalletService) AddTransaction(transaction *models.WalletTransaction) error {
	tx, err := ws.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Insert transaction
	transactionQuery := `
		INSERT INTO wallet_transactions (id, user_id, type, amount, description, reference_id, 
			reference_type, balance_type, status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`
	
	_, err = tx.Exec(transactionQuery, transaction.ID, transaction.UserID, transaction.Type,
		transaction.Amount, transaction.Description, transaction.ReferenceID, transaction.ReferenceType,
		transaction.BalanceType, transaction.Status, transaction.CreatedAt, transaction.UpdatedAt)
	
	if err != nil {
		return err
	}

	// Update wallet balance
	var updateQuery string
	switch transaction.Type {
	case "deposit", "earning", "refund":
		if transaction.BalanceType == "pending" {
			updateQuery = `UPDATE wallets SET pending_balance = pending_balance + $1, updated_at = $2 WHERE user_id = $3`
		} else {
			updateQuery = `UPDATE wallets SET balance = balance + $1, total_earned = total_earned + $1, updated_at = $2 WHERE user_id = $3`
		}
	case "withdrawal", "payment", "fee":
		if transaction.BalanceType == "pending" {
			updateQuery = `UPDATE wallets SET pending_balance = pending_balance - $1, updated_at = $2 WHERE user_id = $3`
		} else {
			updateQuery = `UPDATE wallets SET balance = balance - $1, total_spent = total_spent + $1, updated_at = $2 WHERE user_id = $3`
		}
	case "transfer_pending_to_available":
		// Move from pending to available balance
		_, err = tx.Exec(`UPDATE wallets SET pending_balance = pending_balance - $1, balance = balance + $1, updated_at = $2 WHERE user_id = $3`,
			transaction.Amount, time.Now(), transaction.UserID)
		if err != nil {
			return err
		}
		return tx.Commit()
	}

	_, err = tx.Exec(updateQuery, transaction.Amount, time.Now(), transaction.UserID)
	if err != nil {
		return err
	}

	return tx.Commit()
}

func (ws *WalletService) GetTransactionsByUserID(userID string, limit, offset int) ([]models.WalletTransaction, error) {
	query := `
		SELECT id, user_id, type, amount, description, reference_id, reference_type, 
			   balance_type, status, created_at, updated_at
		FROM wallet_transactions 
		WHERE user_id = $1 
		ORDER BY created_at DESC 
		LIMIT $2 OFFSET $3`
	
	rows, err := ws.db.Query(query, userID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var transactions []models.WalletTransaction
	for rows.Next() {
		var transaction models.WalletTransaction
		err := rows.Scan(&transaction.ID, &transaction.UserID, &transaction.Type, &transaction.Amount,
			&transaction.Description, &transaction.ReferenceID, &transaction.ReferenceType,
			&transaction.BalanceType, &transaction.Status, &transaction.CreatedAt, &transaction.UpdatedAt)
		if err != nil {
			return nil, err
		}
		transactions = append(transactions, transaction)
	}

	return transactions, nil
}

func (ws *WalletService) ProcessPayment(payerID, payeeID string, amount float64, description, referenceID, referenceType string) error {
	tx, err := ws.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Check payer balance
	var payerBalance float64
	err = tx.QueryRow("SELECT balance FROM wallets WHERE user_id = $1", payerID).Scan(&payerBalance)
	if err != nil {
		return fmt.Errorf("failed to get payer balance: %w", err)
	}

	if payerBalance < amount {
		return fmt.Errorf("insufficient balance")
	}

	// Create payment transaction for payer
	paymentTransaction := &models.WalletTransaction{
		ID:            uuid.New().String(),
		UserID:        payerID,
		Type:          "payment",
		Amount:        amount,
		Description:   description,
		ReferenceID:   &referenceID,
		ReferenceType: &referenceType,
		BalanceType:   "deposit",
		Status:        "completed",
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	// Create earning transaction for payee
	earningTransaction := &models.WalletTransaction{
		ID:            uuid.New().String(),
		UserID:        payeeID,
		Type:          "earning",
		Amount:        amount,
		Description:   description,
		ReferenceID:   &referenceID,
		ReferenceType: &referenceType,
		BalanceType:   "pending", // Earnings go to pending first
		Status:        "completed",
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	// Insert both transactions
	transactionQuery := `
		INSERT INTO wallet_transactions (id, user_id, type, amount, description, reference_id, 
			reference_type, balance_type, status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`

	_, err = tx.Exec(transactionQuery, paymentTransaction.ID, paymentTransaction.UserID, paymentTransaction.Type,
		paymentTransaction.Amount, paymentTransaction.Description, paymentTransaction.ReferenceID,
		paymentTransaction.ReferenceType, paymentTransaction.BalanceType, paymentTransaction.Status,
		paymentTransaction.CreatedAt, paymentTransaction.UpdatedAt)
	if err != nil {
		return err
	}

	_, err = tx.Exec(transactionQuery, earningTransaction.ID, earningTransaction.UserID, earningTransaction.Type,
		earningTransaction.Amount, earningTransaction.Description, earningTransaction.ReferenceID,
		earningTransaction.ReferenceType, earningTransaction.BalanceType, earningTransaction.Status,
		earningTransaction.CreatedAt, earningTransaction.UpdatedAt)
	if err != nil {
		return err
	}

	// Update balances
	_, err = tx.Exec("UPDATE wallets SET balance = balance - $1, total_spent = total_spent + $1, updated_at = $2 WHERE user_id = $3",
		amount, time.Now(), payerID)
	if err != nil {
		return err
	}

	_, err = tx.Exec("UPDATE wallets SET pending_balance = pending_balance + $1, total_earned = total_earned + $1, updated_at = $2 WHERE user_id = $3",
		amount, time.Now(), payeeID)
	if err != nil {
		return err
	}

	return tx.Commit()
}
