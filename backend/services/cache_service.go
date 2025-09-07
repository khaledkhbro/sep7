package services

import (
	"fmt"
	"time"

	"github.com/microjob-marketplace/backend/cache"
)

type CacheService struct {
	redis *cache.RedisClient
}

func NewCacheService(redis *cache.RedisClient) *CacheService {
	return &CacheService{
		redis: redis,
	}
}

// Session management
func (cs *CacheService) SetUserSession(userID int, sessionData interface{}) error {
	key := fmt.Sprintf("session:user:%d", userID)
	return cs.redis.Set(key, sessionData, 24*time.Hour)
}

func (cs *CacheService) GetUserSession(userID int, dest interface{}) error {
	key := fmt.Sprintf("session:user:%d", userID)
	return cs.redis.Get(key, dest)
}

func (cs *CacheService) InvalidateUserSession(userID int) error {
	key := fmt.Sprintf("session:user:%d", userID)
	return cs.redis.Delete(key)
}

// Rate limiting
func (cs *CacheService) CheckRateLimit(identifier string, limit int, window time.Duration) (bool, error) {
	key := fmt.Sprintf("rate_limit:%s", identifier)
	
	count, err := cs.redis.Increment(key)
	if err != nil {
		return false, err
	}
	
	if count == 1 {
		cs.redis.SetExpiration(key, window)
	}
	
	return count <= int64(limit), nil
}

// Job queue for background tasks
func (cs *CacheService) EnqueueJob(jobType string, payload interface{}) error {
	key := fmt.Sprintf("job_queue:%s", jobType)
	return cs.redis.Set(key, payload, 1*time.Hour)
}

// Popular jobs caching
func (cs *CacheService) CachePopularJobs(jobs interface{}) error {
	return cs.redis.Set("popular_jobs", jobs, 30*time.Minute)
}

func (cs *CacheService) GetPopularJobs(dest interface{}) error {
	return cs.redis.Get("popular_jobs", dest)
}

// Statistics caching
func (cs *CacheService) CacheDailyStats(stats interface{}) error {
	return cs.redis.Set(cache.StatsKey, stats, 1*time.Hour)
}

func (cs *CacheService) GetDailyStats(dest interface{}) error {
	return cs.redis.Get(cache.StatsKey, dest)
}

// Search results caching
func (cs *CacheService) CacheSearchResults(query string, results interface{}) error {
	key := fmt.Sprintf("search:%s", query)
	return cs.redis.Set(key, results, 15*time.Minute)
}

func (cs *CacheService) GetSearchResults(query string, dest interface{}) error {
	key := fmt.Sprintf("search:%s", query)
	return cs.redis.Get(key, dest)
}
