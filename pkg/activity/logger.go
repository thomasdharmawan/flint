package activity

import (
	"crypto/rand"
	"encoding/hex"
	"github.com/ccheshirecat/flint/pkg/core"
	"sync"
	"time"
)

// Logger is an in-memory, thread-safe, capped-size activity logger.
type Logger struct {
	mu      sync.RWMutex
	events  []core.ActivityEvent
	maxSize int
}

// NewLogger creates a new activity logger with the specified max size.
func NewLogger(maxSize int) *Logger {
	if maxSize <= 0 {
		maxSize = 50 // default
	}
	return &Logger{
		events:  make([]core.ActivityEvent, 0, maxSize),
		maxSize: maxSize,
	}
}

// Add adds a new activity event.
func (l *Logger) Add(action, target, status, message string) {
	l.mu.Lock()
	defer l.mu.Unlock()

	// Generate a simple ID
	idBytes := make([]byte, 8)
	rand.Read(idBytes)
	id := hex.EncodeToString(idBytes)

	event := core.ActivityEvent{
		ID:        id,
		Timestamp: time.Now().Unix(),
		Action:    action,
		Target:    target,
		Status:    status,
		Message:   message,
	}

	l.events = append(l.events, event)

	// Trim if we exceed max size
	if len(l.events) > l.maxSize {
		// Keep the most recent events
		l.events = l.events[len(l.events)-l.maxSize:]
	}
}

// Get returns a copy of all current activity events.
func (l *Logger) Get() []core.ActivityEvent {
	l.mu.RLock()
	defer l.mu.RUnlock()

	// Return a copy to prevent external modification
	result := make([]core.ActivityEvent, len(l.events))
	copy(result, l.events)
	return result
}
