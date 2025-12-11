import firebase_admin
from firebase_admin import credentials, messaging
import os
import logging

logger = logging.getLogger(__name__)

class NotificationService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(NotificationService, cls).__new__(cls)
            cls._instance.active = False
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        # Check specifically in the root directory
        cred_path = os.path.join(os.getcwd(), "serviceAccountKey.json")
        if os.path.exists(cred_path):
            try:
                # Check if already initialized
                if not firebase_admin._apps:
                    cred = credentials.Certificate(cred_path)
                    firebase_admin.initialize_app(cred)
                self.active = True
                logger.info("Firebase Admin Initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Firebase: {e}")
                self.active = False
        else:
            logger.warning(f"serviceAccountKey.json not found at {cred_path}. Notifications will be disabled.")
            self.active = False

    def send_multicast(self, tokens: list, title: str, body: str, data: dict = None, db_session=None):
        """
        Send a multicast message to multiple devices.
        tokens: list of FCM registration tokens
        title: notification title
        body: notification body
        data: optional data dictionary (all values must be strings)
        db_session: optional database session for cleaning up invalid tokens
        """
        if not self.active:
            logger.warning("NotificationService is not active. Skipping send.")
            return {"success": False, "reason": "service_inactive"}

        if not tokens:
            logger.info("No tokens provided for notification")
            return {"success": True, "sent": 0, "failed": 0}

        # Remove duplicates and empty tokens
        tokens = list(set([t for t in tokens if t and t.strip()]))
        
        if not tokens:
            return {"success": True, "sent": 0, "failed": 0}

        # Ensure all data values are strings
        safe_data = {}
        if data:
            for k, v in data.items():
                safe_data[str(k)] = str(v)

        invalid_tokens = []
        
        try:
            # Configure notification with Android-specific settings
            android_config = messaging.AndroidConfig(
                priority='high',
                notification=messaging.AndroidNotification(
                    channel_id='default_channel',
                    sound='default',
                    priority='high',
                    default_vibrate_timings=True,
                    default_light_settings=True,
                )
            )
            
            message = messaging.MulticastMessage(
                notification=messaging.Notification(
                    title=title,
                    body=body,
                ),
                data=safe_data,
                tokens=tokens,
                android=android_config,
            )
            
            # Use send_each_for_multicast instead of send_multicast
            response = messaging.send_each_for_multicast(message)
            
            logger.info(f'✅ {response.success_count}/{len(tokens)} messages sent successfully')
            
            if response.failure_count > 0:
                logger.warning(f'⚠️ {response.failure_count}/{len(tokens)} messages failed')
                
                for idx, resp in enumerate(response.responses):
                    if not resp.success:
                        token = tokens[idx]
                        error_code = None
                        
                        if resp.exception:
                            error_msg = str(resp.exception)
                            logger.warning(f'❌ Failed to send to token {token[:20]}...: {error_msg}')
                            
                            # Check for invalid token errors
                            if any(err in error_msg.lower() for err in [
                                'registration-token-not-registered',
                                'invalid-registration-token',
                                'invalid-argument',
                                'not-found'
                            ]):
                                invalid_tokens.append(token)
                                logger.info(f'🗑️ Marking token as invalid: {token[:20]}...')
            
            # Clean up invalid tokens if db_session provided
            if invalid_tokens and db_session:
                try:
                    from app.models.user_device_model import UserDevice
                    deleted = db_session.query(UserDevice).filter(
                        UserDevice.fcm_token.in_(invalid_tokens)
                    ).delete(synchronize_session=False)
                    db_session.commit()
                    logger.info(f'🗑️ Cleaned up {deleted} invalid tokens from database')
                except Exception as e:
                    logger.error(f'Error cleaning up invalid tokens: {e}')
                    db_session.rollback()
            
            return {
                "success": True,
                "sent": response.success_count,
                "failed": response.failure_count,
                "invalid_tokens": len(invalid_tokens)
            }
            
        except Exception as e:
            logger.error(f"Error sending notification: {e}")
            return {"success": False, "error": str(e)}

notification_service = NotificationService()
