package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/go-redis/redis/v8"
)

type RedisClient struct {
	client *redis.Client
	ctx    context.Context
}

func NewRedisClient(url, password string, db int) (*RedisClient, error) {
	rdb := redis.NewClient(&redis.Options{
		Addr:     url,
		Password: password,
		DB:       db,
	})

	ctx := context.Background()
	
	// Test connection
	_, err := rdb.Ping(ctx).Result()
	if err != nil {
		return nil, fmt.Errorf("failed to connect to Redis: %w", err)
	}

	log.Println("Successfully connected to Redis")
	return &RedisClient{
		client: rdb,
		ctx:    ctx,
	}, nil
}

func (r *RedisClient) Set(key string, value interface{}, expiration time.Duration) error {
	jsonValue, err := json.Marshal(value)
	if err != nil {
		return err
	}
	return r.client.Set(r.ctx, key, jsonValue, expiration).Err()
}

func (r *RedisClient) Get(key string, dest interface{}) error {
	val, err := r.client.Get(r.ctx, key).Result()
	if err != nil {
		return err
	}
	return json.Unmarshal([]byte(val), dest)
}

func (r *RedisClient) Delete(key string) error {
	return r.client.Del(r.ctx, key).Err()
}

func (r *RedisClient) Exists(key string) bool {
	result, err := r.client.Exists(r.ctx, key).Result()
	return err == nil && result > 0
}

func (r *RedisClient) SetString(key, value string, expiration time.Duration) error {
	return r.client.Set(r.ctx, key, value, expiration).Err()
}

func (r *RedisClient) GetString(key string) (string, error) {
	return r.client.Get(r.ctx, key).Result()
}

func (r *RedisClient) Increment(key string) (int64, error) {
	return r.client.Incr(r.ctx, key).Result()
}

func (r *RedisClient) SetExpiration(key string, expiration time.Duration) error {
	return r.client.Expire(r.ctx, key, expiration).Err()
}

func (r *RedisClient) FlushAll() error {
	return r.client.FlushAll(r.ctx).Err()
}

func (r *RedisClient) Close() error {
	return r.client.Close()
}

// Cache keys constants
const (
	UserCacheKey     = "user:%d"
	JobCacheKey      = "job:%d"
	JobListCacheKey  = "jobs:list:%s"
	CategoryCacheKey = "categories"
	StatsKey         = "stats:daily"
)

// Helper functions for common cache operations
func (r *RedisClient) CacheUser(userID int, user interface{}) error {
	key := fmt.Sprintf(UserCacheKey, userID)
	return r.Set(key, user, 15*time.Minute)
}

func (r *RedisClient) GetCachedUser(userID int, dest interface{}) error {
	key := fmt.Sprintf(UserCacheKey, userID)
	return r.Get(key, dest)
}

func (r *RedisClient) CacheJob(jobID int, job interface{}) error {
	key := fmt.Sprintf(JobCacheKey, jobID)
	return r.Set(key, job, 10*time.Minute)
}

func (r *RedisClient) GetCachedJob(jobID int, dest interface{}) error {
	key := fmt.Sprintf(JobCacheKey, jobID)
	return r.Get(key, dest)
}

func (r *RedisClient) InvalidateUserCache(userID int) error {
	key := fmt.Sprintf(UserCacheKey, userID)
	return r.Delete(key)
}

func (r *RedisClient) InvalidateJobCache(jobID int) error {
	key := fmt.Sprintf(JobCacheKey, jobID)
	return r.Delete(key)
}
