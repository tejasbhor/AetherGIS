"""AetherGIS — Exclusive Session Lock Service (MODULE 12).
Manages the 'one-user-at-a-time' constraint for SaaS deployments.
"""
from __future__ import annotations

import time
from typing import Optional, Dict, Any
import redis as redis_sync
from backend.app.config import get_settings
from backend.app.utils.logging import get_logger

settings = get_settings()
logger = get_logger(__name__)

# Redis Keys
LOCK_KEY = "aethergis:session:active_user"
HEARTBEAT_KEY = "aethergis:session:heartbeat"
WAITLIST_KEY = "aethergis:session:waitlist"
QUEUE_METADATA_KEY = "aethergis:session:queue_meta"

# Configuration
SESSION_TTL = 300  # 5 minutes of idle time allowed
QUEUE_POLL_INTERVAL = 10

class SessionLockService:
    def __init__(self):
        try:
            self.r = redis_sync.from_url(
                settings.redis_url, 
                decode_responses=True,
                socket_connect_timeout=2
            )
            self.r.ping()
            self.available = True
        except Exception as exc:
            logger.warning("Redis unavailable for SessionLock — disabling queuing logic", error=str(exc))
            self.available = False

    def get_status(self, session_id: str) -> Dict[str, Any]:
        """Check if the given session_id has control or is in queue."""
        if not self.available or settings.aether_mode == 'development':
            return {"status": "granted", "is_active": True, "queue_pos": 0}

        active_user = self.r.get(LOCK_KEY)
        
        # 1. User already has the lock
        if active_user == session_id:
            self._refresh_heartbeat(session_id)
            return {"status": "granted", "is_active": True, "queue_pos": 0}

        # 2. Nobody has the lock — claim it
        if not active_user:
            return self._claim_lock(session_id)

        # 3. Someone else has the lock — check waitlist
        pos = self._get_waitlist_position(session_id)
        if pos == -1:
            # Not in waitlist yet? Add them.
            pos = self._add_to_waitlist(session_id)

        return {
            "status": "waiting",
            "is_active": False,
            "active_user_hint": active_user[:8],
            "queue_pos": pos,
            "wait_time_est_min": pos * 5 # Rough estimate
        }

    def heartbeat(self, session_id: str):
        """Update the heartbeat to prevent session expiration."""
        if self.available and settings.aether_mode == 'production':
            active_user = self.r.get(LOCK_KEY)
            if active_user == session_id:
                self._refresh_heartbeat(session_id)

    def force_release(self):
        """Admin override to clear the current lock."""
        if self.available:
            self.r.delete(LOCK_KEY)
            self.r.delete(HEARTBEAT_KEY)
            self._process_next_in_queue()

    def _claim_lock(self, session_id: str) -> Dict[str, Any]:
        # Atomic SET NX
        if self.r.set(LOCK_KEY, session_id, nx=True, ex=SESSION_TTL):
            logger.info("Session lock claimed", session_id=session_id)
            self._refresh_heartbeat(session_id)
            self.r.lrem(WAITLIST_KEY, 0, session_id) # Remove from waitlist if they were there
            return {"status": "granted", "is_active": True, "queue_pos": 0}
        
        # Re-check in case of race condition
        return self.get_status(session_id)

    def _refresh_heartbeat(self, session_id: str):
        self.r.expire(LOCK_KEY, SESSION_TTL)
        self.r.setex(f"{HEARTBEAT_KEY}:{session_id}", 30, str(time.time()))

    def _add_to_waitlist(self, session_id: str) -> int:
        # Add to tail if not present
        list_items = self.r.lrange(WAITLIST_KEY, 0, -1)
        if session_id not in list_items:
            self.r.rpush(WAITLIST_KEY, session_id)
        
        pos = self.r.lpos(WAITLIST_KEY, session_id)
        return (pos + 1) if pos is not None else 1

    def _get_waitlist_position(self, session_id: str) -> int:
        pos = self.r.lpos(WAITLIST_KEY, session_id)
        return (pos + 1) if pos is not None else -1

    def _process_next_in_queue(self):
        next_user = self.r.lpop(WAITLIST_KEY)
        if next_user:
            logger.info("Transferring lock to next user in queue", next_user=next_user)
            self._claim_lock(next_user)

# Singleton
lock_service = SessionLockService()
