

from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view
from rest_framework.response import Response
from twilio.rest import Client
from twilio.twiml.voice_response import VoiceResponse
from twilio.jwt.access_token import AccessToken
from twilio.jwt.access_token.grants import VoiceGrant
from .models import CallLog
from dateutil.parser import parse as parse_datetime
import logging

ACCOUNT_SID = "ACdc68d30744cecc94bdc2a335ab19301b"
AUTH_TOKEN = "d328fe96756b5e7a76298ae0bd4374ae"
TWILIO_NUMBER = "+19153363542"
OUTGOING_APP_SID = "APd2496d1d554649dffa6b8a409d65eda3"


@csrf_exempt
@api_view(['POST'])
def make_call(request):
    to_number = request.data.get('to')
    if not to_number:
        return Response({"error": "Phone number is required"}, status=400)
    
    client = Client(ACCOUNT_SID, AUTH_TOKEN)
    try:
        call = client.calls.create(
            from_=TWILIO_NUMBER,
            to=to_number,
            url=f"https://your-ngrok-url.ngrok.io/api/voice/?To={to_number}"  # update with your ngrok
        )
        return Response({"sid": call.sid, "status": "initiated"})
    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(['GET'])
def call_logs(request):
    client = Client(ACCOUNT_SID, AUTH_TOKEN)
    try:
        calls = client.calls.list(limit=20)
        call_data = []
        for call in calls:
            start_time = getattr(call, "start_time", None)
            parsed_time = parse_datetime(str(start_time)) if start_time else None
            CallLog.objects.create(
                from_number=getattr(call, "_from", None),
                to_number=getattr(call, "to", None),
                status=getattr(call, "status", None),
                start_time=parsed_time,
                duration=int(call.duration) if call.duration else None,
                direction=getattr(call, "direction", None),
            )
            call_data.append({
                "from": getattr(call, "_from", None),
                "to": getattr(call, "to", None),
                "status": getattr(call, "status", None),
                "start_time": str(start_time),
                "duration": getattr(call, "duration", None),
                "direction": getattr(call, "direction", None),
            })
        return Response({"calls": call_data})
    except Exception as e:
        logging.exception("Error fetching or saving call logs")
        return Response({"error": str(e)}, status=500)


@api_view(['POST'])
def end_call(request):
    call_sid = request.data.get('call_sid')
    if not call_sid:
        return Response({'error': 'Call SID is required'}, status=400)
    try:
        client = Client(ACCOUNT_SID, AUTH_TOKEN)
        call = client.calls(call_sid).update(status='completed')
        return Response({'status': 'Call ended', 'call_sid': call.sid})
    except Exception as e:
        return Response({'error': str(e)}, status=500)


# @api_view(['GET'])
# def call_status(request):
#     sid = request.query_params.get('sid')
#     if not sid:
#         return Response({"error": "sid is required"}, status=400)
#     try:
#         client = Client(ACCOUNT_SID, AUTH_TOKEN)
#         call = client.calls(sid).fetch()
#         return Response({"status": call.status})
#     except Exception as e:
#         return Response({"error": str(e)}, status=500})
@api_view(['GET'])
def call_status(request):
    sid = request.query_params.get('sid')
    if not sid:
        return Response({"error": "sid is required"}, status=400)

    client = Client(ACCOUNT_SID, AUTH_TOKEN)
    try:
        call = client.calls(sid).fetch()
        return Response({"status": call.status})
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@csrf_exempt
def incoming_call(request):
    from_number = request.POST.get('_from') or request.GET.get('_from')
    to_number = request.POST.get('to') or request.GET.get('to')
    call_sid = request.POST.get('call_sid') or request.GET.get('call_sid')
    print(f'📞 Incoming call from {from_number} to {to_number} (SID: {call_sid})')

    response = VoiceResponse()
    response.say("You have an incoming call from your dashboard app.", voice="alice")
    response.dial().client("web-client")  # same identity from token
    return HttpResponse(str(response), content_type='application/xml')


@api_view(['GET'])
def get_twilio_token(request):
    api_key = 'SK0cd206a9aeab44034efab8ac15c1c56a'
    api_secret = '5xTsIQgj72FVDG6785UmdAtUwc65M2Da'
    identity = 'web-client'
    token = AccessToken(ACCOUNT_SID, api_key, api_secret, identity=identity)
    voice_grant = VoiceGrant(outgoing_application_sid=OUTGOING_APP_SID, incoming_allow=True)
    token.add_grant(voice_grant)
    return JsonResponse({'token': str(token)})


@csrf_exempt
def outbound_call_twiml(request):
    to_number = request.GET.get("To") or request.POST.get("To")
    response = VoiceResponse()
    if to_number:
        dial = response.dial(callerId=TWILIO_NUMBER)
        dial.number(to_number)
    else:
        response.say("No phone number provided.")
    return HttpResponse(str(response), content_type='application/xml')
