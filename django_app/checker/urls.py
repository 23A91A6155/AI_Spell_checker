from django.urls import path
from . import views

urlpatterns = [
    path('history/', views.history_list, name='history-list'),
    path('history/<int:pk>/', views.history_detail, name='history-detail'),
    path('stats/', views.stats, name='stats'),
]
