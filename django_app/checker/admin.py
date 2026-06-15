from django.contrib import admin
from .models import CheckHistory


@admin.register(CheckHistory)
class CheckHistoryAdmin(admin.ModelAdmin):
    list_display = ('check_type', 'errors_found', 'readability_score', 'created_at', 'short_text')
    list_filter = ('check_type', 'created_at')
    search_fields = ('original_text', 'corrected_text')
    readonly_fields = ('created_at',)
    ordering = ('-created_at',)

    def short_text(self, obj):
        return obj.original_text[:50] + '...' if len(obj.original_text) > 50 else obj.original_text
    short_text.short_description = 'Original Text'
