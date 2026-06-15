from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from .models import CheckHistory
import json


@csrf_exempt
@require_http_methods(["GET", "POST"])
def history_list(request):
    if request.method == 'GET':
        limit = int(request.GET.get('limit', 20))
        histories = CheckHistory.objects.all()[:limit]
        data = [{
            'id': h.id,
            'original_text': h.original_text[:100] + '...' if len(h.original_text) > 100 else h.original_text,
            'corrected_text': h.corrected_text[:100] + '...' if len(h.corrected_text) > 100 else h.corrected_text,
            'check_type': h.check_type,
            'errors_found': h.errors_found,
            'readability_score': h.readability_score,
            'created_at': h.created_at.isoformat(),
        } for h in histories]
        return JsonResponse({'results': data})

    elif request.method == 'POST':
        body = json.loads(request.body)
        history = CheckHistory.objects.create(
            original_text=body.get('original_text', ''),
            corrected_text=body.get('corrected_text', ''),
            check_type=body.get('check_type', 'full'),
            errors_found=body.get('errors_found', 0),
            corrections=body.get('corrections', []),
            readability_score=body.get('readability_score'),
        )
        return JsonResponse({'id': history.id, 'status': 'saved'}, status=201)


@csrf_exempt
@require_http_methods(["GET", "DELETE"])
def history_detail(request, pk):
    try:
        history = CheckHistory.objects.get(pk=pk)
    except CheckHistory.DoesNotExist:
        return JsonResponse({'error': 'Not found'}, status=404)

    if request.method == 'GET':
        return JsonResponse({
            'id': history.id,
            'original_text': history.original_text,
            'corrected_text': history.corrected_text,
            'check_type': history.check_type,
            'errors_found': history.errors_found,
            'corrections': history.corrections,
            'readability_score': history.readability_score,
            'created_at': history.created_at.isoformat(),
        })

    elif request.method == 'DELETE':
        history.delete()
        return JsonResponse({'status': 'deleted'})


@require_http_methods(["GET"])
def stats(request):
    from django.db.models import Count, Avg, Sum
    total = CheckHistory.objects.count()
    by_type = dict(
        CheckHistory.objects.values_list('check_type')
        .annotate(count=Count('id'))
        .values_list('check_type', 'count')
    )
    avg_errors = CheckHistory.objects.aggregate(avg=Avg('errors_found'))['avg'] or 0
    total_errors = CheckHistory.objects.aggregate(total=Sum('errors_found'))['total'] or 0
    return JsonResponse({
        'total_checks': total,
        'by_type': by_type,
        'avg_errors_per_check': round(avg_errors, 1),
        'total_errors_found': total_errors,
    })
