# n8n Workflow JSON

To use this workflow:
1. Copy the JSON below.
2. In n8n, go to **Menu > Import from JSON**.
3. Paste the content and click **Import**.

```json
{
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "blood-alert",
        "options": {}
      },
      "id": "38e967f9-3ff9-4044-ba2f-5d9a966f001f",
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [
        -656,
        128
      ],
      "webhookId": "6ac0a5c6-4f75-477e-b6f7-074350455fdc"
    },
    {
      "parameters": {
        "functionCode": "const parsedBody = items[0].json.body;\nconst requestedBlood = parsedBody.bloodGroup;\nconst usersList = parsedBody.donorsPool;\n\nif (!usersList || usersList.length === 0) {\n  return [{ json: { message: \"No donors found\" } }];\n}\n\nreturn usersList.map(user => ({\n  json: {\n    ...user,\n    requestedBloodForThisAlert: requestedBlood,\n    patientName: parsedBody.patientName || 'Unknown Patient',\n    urgency: parsedBody.urgency || 'Emergency',\n    requestId: parsedBody.requestId || ''\n  }\n}));"
      },
      "id": "2628602c-8a93-499d-a7a2-4c1899813191",
      "name": "Format Donor List",
      "type": "n8n-nodes-base.function",
      "typeVersion": 1,
      "position": [
        -448,
        128
      ]
    },
    {
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "={{$json[\"bloodGroup\"]}}",
              "value2": "={{$json[\"requestedBloodForThisAlert\"]}}"
            }
          ],
          "boolean": [
            {
              "value1": "={{$json[\"isAvailable\"]}}",
              "value2": true
            }
          ]
        }
      },
      "id": "617a5deb-258b-45d4-97bd-6d797ab7d4d3",
      "name": "Filter Matching Donors",
      "type": "n8n-nodes-base.if",
      "typeVersion": 1,
      "position": [
        -224,
        128
      ]
    },
    {
      "parameters": {
        "subject": "=🚨 URGENT: {{ $json[\"requestedBloodForThisAlert\"] }} Blood Needed",
        "message": "=<div style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0d0d0d;color:#fff;border-radius:16px;overflow:hidden'><div style='background:linear-gradient(135deg,#e60026,#8b0000);padding:32px;text-align:center'><h1 style='margin:0;font-size:26px;font-weight:900'>🚨 URGENT BLOOD ALERT</h1><p style='margin:8px 0 0;opacity:.9;font-size:14px'>A life depends on your response</p></div><div style='padding:32px'><p style='font-size:18px'>Hi <strong>{{ $json[\"name\"] }}</strong>,</p><p style='color:#aaa'>A patient urgently needs blood that matches yours. You are their best hope right now.</p><table style='width:100%;background:#1a1a1a;border-radius:12px;padding:20px;border-collapse:collapse'><tr><td style='padding:10px;color:#888;font-size:13px'>🩸 Blood Group Needed</td><td style='padding:10px;font-weight:900;color:#e60026;font-size:22px;text-align:right'>{{ $json[\"requestedBloodForThisAlert\"] }}</td></tr><tr><td style='padding:10px;color:#888;font-size:13px'>⚠️ Urgency</td><td style='padding:10px;color:#ff6b6b;font-weight:bold;text-align:right'>{{ $json[\"urgency\"] }}</td></tr><tr><td style='padding:10px;color:#888;font-size:13px'>👤 Patient</td><td style='padding:10px;color:#fff;text-align:right'>{{ $json[\"patientName\"] }}</td></tr><tr><td style='padding:10px;color:#888;font-size:13px'>🩸 Your Group</td><td style='padding:10px;color:#4ade80;font-weight:bold;text-align:right'>{{ $json[\"bloodGroup\"] }} ✓ Match</td></tr></table><div style='text-align:center;margin-top:32px'><a href='https://principal-yen-460311-a9.web.app' style='background:#e60026;color:#fff;padding:16px 40px;border-radius:999px;text-decoration:none;font-weight:900;font-size:16px;display:inline-block'>Open App &amp; Accept Request →</a></div><p style='color:#555;font-size:12px;text-align:center;margin-top:24px'>You received this because you are a registered donor on LifeLink. Your blood group matches this emergency request.</p></div></div>",
        "additionalFields": {}
      },
      "id": "cd4d1f01-eae6-4846-a0ca-8f67fe494f5b",
      "name": "Send Gmail Alert",
      "type": "n8n-nodes-base.gmail",
      "typeVersion": 1,
      "position": [
        0,
        240
      ],
      "credentials": {
        "gmailOAuth2": {
          "id": "M8YJAZt3sy76rXR2",
          "name": "Gmail account"
        }
      }
    },
    {
      "parameters": {
        "from": "+14155238886",
        "to": "=+91{{ $json.phone }}",
        "toWhatsapp": true,
        "message": "=🚨 *URGENT BLOOD REQUIRED* 🚨\\n\\nHi {{ $json.name }},\\n\\nA patient urgently needs blood that matches yours!\\n\\n🩸 *Blood Needed:{{ $json.bloodGroup }}\\n⚠️ *Urgency:{{ $json.urgency }}\\n👤 *Patient: {{ $json.patientName }}\\n\\nYour blood group{{ $json.bloodGroup }}  is a match. Please open the Blood Donation App to accept the request and save a life!\\n\\nThank you for being a hero! ❤️",
        "options": {}
      },
      "type": "n8n-nodes-base.twilio",
      "typeVersion": 1,
      "position": [
        208,
        0
      ],
      "id": "473757a3-ac8d-4d31-9af6-9daacfad264c",
      "name": "Send an SMS/MMS/WhatsApp message",
      "credentials": {
        "twilioApi": {
          "id": "X3ZehY5dJ5kKBhZp",
          "name": "Twilio account"
        }
      }
    }
  ],
  "connections": {
    "Webhook": {
      "main": [
        [
          {
            "node": "Format Donor List",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Format Donor List": {
      "main": [
        [
          {
            "node": "Filter Matching Donors",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Filter Matching Donors": {
      "main": [
        [
          {
            "node": "Send Gmail Alert",
            "type": "main",
            "index": 0
          },
          {
            "node": "Send an SMS/MMS/WhatsApp message",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "pinData": {},
  "meta": {
    "templateCredsSetupCompleted": true,
    "instanceId": "4d6436393ac745cdb2392e54a449335e1543ebebfd36edbc767708be7289cc09"
  }
}
```
