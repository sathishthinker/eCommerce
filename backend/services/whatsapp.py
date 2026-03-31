import logging
import os
import requests

logger = logging.getLogger(__name__)


def send_whatsapp_message(to: str, template_name: str, variables: list) -> bool:
    """
    Send a WhatsApp template message via Meta Cloud API.
    Fire-and-forget: logs errors, never raises.

    Args:
        to: Phone number with country code, no + (e.g. 919876543210)
        template_name: Meta-approved template name
        variables: List of variable values for template body components
    """
    access_token = os.environ.get("WHATSAPP_ACCESS_TOKEN", "")
    phone_number_id = os.environ.get("WHATSAPP_PHONE_NUMBER_ID", "")

    if not access_token or not phone_number_id:
        logger.warning(
            "WhatsApp credentials not configured. Skipping message to %s.", to
        )
        return False

    url = f"https://graph.facebook.com/v19.0/{phone_number_id}/messages"

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }

    body = {
        "messaging_product": "whatsapp",
        "to": to,
        "type": "template",
        "template": {
            "name": template_name,
            "language": {"code": "en"},
            "components": [
                {
                    "type": "body",
                    "parameters": [
                        {"type": "text", "text": str(v)} for v in variables
                    ],
                }
            ],
        },
    }

    try:
        response = requests.post(url, headers=headers, json=body, timeout=10)
        if response.status_code == 200:
            return True
        else:
            logger.error(
                "WhatsApp API returned %s for template '%s' to %s: %s",
                response.status_code,
                template_name,
                to,
                response.text,
            )
            return False
    except requests.exceptions.Timeout:
        logger.error(
            "WhatsApp API request timed out for template '%s' to %s.",
            template_name,
            to,
        )
        return False
    except Exception as exc:
        logger.error(
            "Unexpected error sending WhatsApp message to %s: %s", to, exc
        )
        return False
