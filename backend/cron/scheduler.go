package cron

import (
	"log"
	"time"

	"github.com/robfig/cron/v3"
	"microjob-backend/services"
)

type CronScheduler struct {
	cron                *cron.Cron
	reservationService  *services.ReservationService
	workProofService    *services.WorkProofService
	walletService       *services.WalletService
	adminService        *services.AdminService
}

func NewCronScheduler(reservationService *services.ReservationService, workProofService *services.WorkProofService,
	walletService *services.WalletService, adminService *services.AdminService) *CronScheduler {
	c := cron.New(cron.WithSeconds())
	
	return &CronScheduler{
		cron:               c,
		reservationService: reservationService,
		workProofService:   workProofService,
		walletService:      walletService,
		adminService:       adminService,
	}
}

func (cs *CronScheduler) Start() {
	log.Println("[CRON] Starting cron scheduler...")

	// Process expired reservations every 5 minutes
	cs.cron.AddFunc("0 */5 * * * *", cs.processExpiredReservations)
	
	// Process work proof timeouts every 10 minutes
	cs.cron.AddFunc("0 */10 * * * *", cs.processWorkProofTimeouts)
	
	// Cleanup old data daily at 2 AM
	cs.cron.AddFunc("0 0 2 * * *", cs.dailyCleanup)
	
	// Generate reports weekly on Sunday at 3 AM
	cs.cron.AddFunc("0 0 3 * * 0", cs.weeklyReports)

	cs.cron.Start()
	log.Println("[CRON] Cron scheduler started successfully")
}

func (cs *CronScheduler) Stop() {
	log.Println("[CRON] Stopping cron scheduler...")
	cs.cron.Stop()
	log.Println("[CRON] Cron scheduler stopped")
}

func (cs *CronScheduler) processExpiredReservations() {
	log.Println("[CRON] Processing expired reservations...")
	
	processed, err := cs.reservationService.CleanupExpiredReservations()
	if err != nil {
		log.Printf("[CRON] Error processing expired reservations: %v", err)
		return
	}
	
	if processed > 0 {
		log.Printf("[CRON] Successfully processed %d expired reservations", processed)
		
		// Create violation records for users with multiple expired reservations
		err = cs.createReservationViolations()
		if err != nil {
			log.Printf("[CRON] Error creating violation records: %v", err)
		}
	} else {
		log.Println("[CRON] No expired reservations found")
	}
}

func (cs *CronScheduler) processWorkProofTimeouts() {
	log.Println("[CRON] Processing work proof timeouts...")
	
	processed, err := cs.workProofService.ProcessExpiredDeadlines(cs.walletService)
	if err != nil {
		log.Printf("[CRON] Error processing work proof timeouts: %v", err)
		return
	}
	
	if processed > 0 {
		log.Printf("[CRON] Successfully processed %d expired work proof deadlines", processed)
	} else {
		log.Println("[CRON] No expired work proof deadlines found")
	}
}

func (cs *CronScheduler) dailyCleanup() {
	log.Println("[CRON] Starting daily cleanup...")
	
	// Cleanup old notifications (older than 30 days)
	cutoffDate := time.Now().AddDate(0, 0, -30)
	
	// Clean up old notifications
	_, err := cs.adminService.CleanupOldNotifications(cutoffDate)
	if err != nil {
		log.Printf("[CRON] Error cleaning up notifications: %v", err)
	} else {
		log.Println("[CRON] Successfully cleaned up old notifications")
	}
	
	// Archive completed transactions older than 90 days
	archiveCutoff := time.Now().AddDate(0, 0, -90)
	_, err = cs.walletService.ArchiveOldTransactions(archiveCutoff)
	if err != nil {
		log.Printf("[CRON] Error archiving transactions: %v", err)
	} else {
		log.Println("[CRON] Successfully archived old transactions")
	}
	
	// Cleanup expired reservation violations older than 6 months
	violationCutoff := time.Now().AddDate(0, -6, 0)
	_, err = cs.reservationService.CleanupOldViolations(violationCutoff)
	if err != nil {
		log.Printf("[CRON] Error cleaning up violations: %v", err)
	} else {
		log.Println("[CRON] Successfully cleaned up old violations")
	}
	
	log.Println("[CRON] Daily cleanup completed")
}

func (cs *CronScheduler) weeklyReports() {
	log.Println("[CRON] Generating weekly reports...")
	
	// Generate platform statistics for the past week
	weekStart := time.Now().AddDate(0, 0, -7)
	weekEnd := time.Now()
	
	// Get weekly statistics
	stats, err := cs.adminService.GenerateWeeklyStats(weekStart, weekEnd)
	if err != nil {
		log.Printf("[CRON] Error generating weekly stats: %v", err)
		return
	}
	
	log.Printf("[CRON] Weekly Stats - Jobs: %d, Users: %d, Revenue: $%.2f", 
		stats.JobsCompleted, stats.NewUsers, stats.TotalRevenue)
	
	// Send admin notification about weekly performance
	err = cs.adminService.SendWeeklyReport(stats)
	if err != nil {
		log.Printf("[CRON] Error sending weekly report: %v", err)
	} else {
		log.Println("[CRON] Weekly report sent to administrators")
	}
	
	// Update user metrics and badges
	err = cs.adminService.UpdateUserMetrics()
	if err != nil {
		log.Printf("[CRON] Error updating user metrics: %v", err)
	} else {
		log.Println("[CRON] User metrics updated successfully")
	}
	
	log.Println("[CRON] Weekly reports generated")
}

func (cs *CronScheduler) createReservationViolations() error {
	log.Println("[CRON] Creating reservation violation records...")
	
	// Get users with multiple expired reservations in the last 24 hours
	since := time.Now().Add(-24 * time.Hour)
	violations, err := cs.reservationService.GetRecentViolations(since)
	if err != nil {
		return err
	}
	
	if len(violations) == 0 {
		log.Println("[CRON] No reservation violations found")
		return nil
	}
	
	// Create violation records for users exceeding threshold
	created := 0
	for _, violation := range violations {
		err := cs.reservationService.CreateViolationRecord(violation)
		if err != nil {
			log.Printf("[CRON] Error creating violation record for user %s: %v", violation.UserID, err)
			continue
		}
		created++
	}
	
	log.Printf("[CRON] Created %d violation records", created)
	return nil
}
