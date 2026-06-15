from django.db import models


class CheckHistory(models.Model):
    CHECK_TYPES = [
        ('grammar', 'Grammar Check'),
        ('spelling', 'Spelling Check'),
        ('clarity', 'Clarity Improvement'),
        ('readability', 'Readability Analysis'),
        ('full', 'Full Check'),
    ]

    original_text = models.TextField()
    corrected_text = models.TextField(blank=True, default='')
    check_type = models.CharField(max_length=20, choices=CHECK_TYPES)
    errors_found = models.IntegerField(default=0)
    corrections = models.JSONField(default=list, blank=True)
    readability_score = models.FloatField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'Check Histories'

    def __str__(self):
        return f"{self.get_check_type_display()} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"
