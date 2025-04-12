from django.contrib import admin
from .models import JournalEntry

@admin.register(JournalEntry)
class JournalEntryAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'severity', 'timestamp')  # Added user and severity
    list_filter = ('severity', 'timestamp', 'user')  # Added filters
    search_fields = ('title', 'content', 'user__username')  # Added search
    date_hierarchy = 'timestamp'