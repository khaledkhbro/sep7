package models

import (
	"time"
)

type MarketplaceItem struct {
	ID                string    `json:"id" db:"id"`
	SellerID          string    `json:"seller_id" db:"seller_id"`
	CategoryID        string    `json:"category_id" db:"category_id"`
	Title             string    `json:"title" db:"title"`
	Description       string    `json:"description" db:"description"`
	ShortDescription  *string   `json:"short_description" db:"short_description"`
	Price             float64   `json:"price" db:"price"`
	DeliveryTime      int       `json:"delivery_time" db:"delivery_time"` // in days
	RevisionsIncluded int       `json:"revisions_included" db:"revisions_included"`
	Images            JSONArray `json:"images" db:"images"`
	Tags              JSONArray `json:"tags" db:"tags"`
	Requirements      *string   `json:"requirements" db:"requirements"`
	Status            string    `json:"status" db:"status"` // "active", "paused", "draft"
	Rating            float64   `json:"rating" db:"rating"`
	TotalOrders       int       `json:"total_orders" db:"total_orders"`
	ViewsCount        int       `json:"views_count" db:"views_count"`
	CreatedAt         time.Time `json:"created_at" db:"created_at"`
	UpdatedAt         time.Time `json:"updated_at" db:"updated_at"`
}

type Order struct {
	ID                   string     `json:"id" db:"id"`
	MarketplaceItemID    string     `json:"marketplace_item_id" db:"marketplace_item_id"`
	BuyerID              string     `json:"buyer_id" db:"buyer_id"`
	SellerID             string     `json:"seller_id" db:"seller_id"`
	Amount               float64    `json:"amount" db:"amount"`
	Status               string     `json:"status" db:"status"` // "pending", "in_progress", "delivered", "completed", "cancelled", "disputed"
	RequirementsProvided *string    `json:"requirements_provided" db:"requirements_provided"`
	DeliveryDate         *string    `json:"delivery_date" db:"delivery_date"` // DATE type
	DeliveredAt          *time.Time `json:"delivered_at" db:"delivered_at"`
	CompletedAt          *time.Time `json:"completed_at" db:"completed_at"`
	CreatedAt            time.Time  `json:"created_at" db:"created_at"`
}
